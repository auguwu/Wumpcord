/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { createSocket } = require('dgram');
const MAX_SEQ = (2 ** 16) - 1;
const MAX_TIMESTAMP = (2 ** 32) - 1;
const NaCL = require('tweetnacl');
const { OpusEncoder } = require('node-opus');

/**
 * Represents a network of a UDP connection with Discord
 */
module.exports = class UDPNetwork {
  /**
   * Create an instance of a [UDPNetwork]
   * @param {import('../VoiceConnection')} connection The VoiceConnection this UDP socket will represent.
   * @param {string} ip voice UDP server IP
   * @param {number} port Voice UDP server PORT
   */
  constructor(connection, ip, port) {
    this.connection = connection;
    this.ip = ip;
    this.port = port;
    this.socket = createSocket('udp4');
    this.secretKey = null;
    this.seq = 0;
    this.timestamp = 0;
    this.nonce = Buffer.alloc(24);
    this.encoder = new OpusEncoder(48000);
    this.rtpHeader = Buffer.alloc(12);
    this.rtpHeader[0] = 0x80;
    this.rtpHeader[1] = 0x78;
    this.rtpHeader.writeUIntBE(this.connection.ws.ssrc, 8,4);
    this._debug('Creating a UDP socket!');
    this._findIp();
    this.socket.on('message', this._onMessage.bind(this));
  }


  _findIp() {
    this._debug('UDP socket is now open, starting IP discovery');
    const packet = Buffer.alloc(70);
    packet[0] = 0x1;
    packet[1] = 0x2;
    packet.writeUInt16BE(70, 2);
    packet.writeUInt32BE(this.connection.ws.ssrc, 4);
    this._send(packet);
  }

  /**
   * Parses a IP discovery packet or
   * Decodes voice packets then emits VoiceConnection#audio
   * @param {Buffer} message
   * @private
   */
  _onMessage(message) {
    if (message.byteLength === 70) this._parseIp(message);
  }

  /**
   * Attempts IP discovery
   * @param buffer
   * @private
   */
  _parseIp(buffer) {
    this._debug('Received IP discovery packet, decoding...');
    let ip = '', port;
    for (let i = 4; i < 20; i++) {
      if (buffer[i] === 0x0) continue;
      ip += String.fromCharCode(buffer[i]);
    }
    port = Number(buffer.readUInt16BE(68));
    this._debug(`Discovery complete ${ip}:${port}, going to select protocol!`);
    this.connection.ws.selectProtocol(ip, port);
  }

  _debug(msg) {
    this.connection.guild.client.emit('debug', `[UDP/${this.connection.guild.id}/${this.connection.channel.id}] ${msg}`);
  }

  sendPacket(opusPacket) {
    // Create the RTP header
    this.rtpHeader.writeUIntBE((this.seq + 1) > MAX_SEQ ? 0 : this.seq++, 2, 2);
    this.rtpHeader.writeUIntBE((this.timestamp + 1) > MAX_TIMESTAMP ? 0 : this.timestamp += (960 * 2), 4, 4);

    // Copy the RTP header to the nonce (which is unique per audio packet)
    this.rtpHeader.copy(this.nonce, 0, 0, 12);

    // Encrypt with NaCL and send
    this._send(Buffer.concat([this.rtpHeader, NaCL.secretbox(opusPacket, this.nonce, this.secretKey)]));
  }

  _send(packet) {
    this.socket.send(packet, 0, packet.length, this.port, this.ip, (err) => {
      if (err) {
        this._debug(`Failed to send a UDP packet ${err}`);
      }
    });
  }

  /**
   * Closes the UDP connection
   */
  disconnect() {
    this.socket.disconnect();
  }
};
