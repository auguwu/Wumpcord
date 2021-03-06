/**
 * Copyright (c) 2020-2021 August, Ice
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

import { createSocket, Socket } from 'dgram';
import type VoiceConnection from '../VoiceConnection';
import * as utils from '@augu/utils';

let OpusEncoder = null;
let NaCL: typeof import('tweetnacl') | undefined = undefined;

try {
  OpusEncoder = utils.lazilyRequire<any>('node-opus')?.OpusEncoder;
} catch {
  // noop
}

try {
  NaCL = utils.lazilyRequire<typeof import('tweetnacl')>('tweetnacl');
} catch(ex) {
  // noop
}

const MAX_TIMESTAMP = (2 ** 32) - 1;
const MAX_SEQ = (2 ** 16) - 1;

/**
 * Represents a UDP4 connection with Discord
 */
export default class UDPNetwork {
  private connection: VoiceConnection;
  public secretKey: Uint8Array | null;
  private rtpHeader: Buffer;
  public timestamp: number;
  public encoder: any;
  public socket: Socket;
  private nonce: Buffer;
  private seq: number;
  public port: number;
  public ip: string;

  constructor(
    connection: VoiceConnection,
    ip: string,
    port: number
  ) {
    if (OpusEncoder === null)
      throw new TypeError('Missing `node-opus` library, please install it');

    this.connection = connection;
    this.secretKey = null;
    this.rtpHeader = Buffer.alloc(12);
    this.timestamp = 0;
    this.encoder = new (OpusEncoder as any)(48000);
    this.socket = createSocket('udp4');
    this.nonce = Buffer.alloc(24);
    this.seq = 0;
    this.port = port;
    this.ip = ip;

    this.rtpHeader[0] = 0x80;
    this.rtpHeader[1] = 0x78;
    this.rtpHeader.writeUIntBE(<any> this.connection.ws.ssrc, 8, 4);
    this.findAddress();

    this.socket.on('message', this.onMessage.bind(this));
  }

  private debug(message: string) {
    this.connection.debug(message, `voice:UDPNetwork/${this.connection.guildID}/${this.connection.channelID}`);
  }

  private findAddress() {
    this.debug('Opened a socket connection, starting IP discovery');
    const packet = Buffer.alloc(70);
    packet[0] = 0x1;
    packet[1] = 0x2;

    packet.writeUInt16BE(70, 2);
    packet.writeUInt32BE(<any> this.connection.ws.ssrc, 4);
    this.send(packet);
  }

  private onMessage(message: Buffer) {
    if (message.byteLength === 70) this.decodeAddress(message);
  }

  private decodeAddress(message: Buffer) {
    this.debug('Received IP discovery packet, now decoding...');
    let ip = '';
    let port = 0;

    for (let i = 4; i < 20; i++) {
      if (message[i] === 0x0) continue;

      ip += String.fromCharCode(message[i]);
    }

    port = Number(message.readUInt16BE(68));
    this.debug(`Discovery has been complete "${ip}:${port}", now selecting protocol`);
    this.connection.ws.selectProtocol(ip, port);
  }

  sendPacket(packet: Buffer) {
    this.rtpHeader.writeUIntBE((this.seq + 1) > MAX_SEQ ? 0 : this.seq++, 2, 2);
    this.rtpHeader.writeUIntBE((this.timestamp + 1) > MAX_TIMESTAMP ? 0 : this.timestamp += (960 * 2), 4, 4);

    this.rtpHeader.copy(this.nonce, 0, 0, 12);
    this.send(Buffer.concat([
      this.rtpHeader,
      NaCL!.secretbox(packet, this.nonce, this.secretKey!)
    ]));
  }

  private send(packet: Buffer) {
    this.socket.send(packet, 0, packet.length, this.port, this.ip, (error) => {
      if (error) return this.debug(`Failed to send a packet\n${error}`);
    });
  }

  disconnect() {
    this.debug('Disconnecting from UDP socket...');
    this.socket.disconnect();
  }

  reset() {
    this.timestamp = 0;
    this.seq = 0;
  }
}
