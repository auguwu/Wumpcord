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

const WebSocket = require('ws');
const UDPNetwork = require('./UDP');

/* eslint-disable camelcase */

/**
 * Represents a WebSocket network with Discord
 */
module.exports = class WebSocketNetwork {
  /**
   * Creates a new instance of a [WebSocketNetwork]
   * @param {import('../VoiceConnection')} con The voice connection
   */
  constructor(con) {
    this.con = con;
    this.session = null;
    this.token = null;
    this.socket = null;
  }

  _cacheState(stateUpdate) {
    this.session = stateUpdate.session_id;
  }

  _spawn(serverUpdate) {
    this.token = serverUpdate.token;
    this.socket = new WebSocket(`wss://${serverUpdate.endpoint}?v=4`);
    this.socket.on('open', () => {
      this._debug('Opened a websocket connection, going to identify when we get OP 8...');
    });
    this.socket.on('message', msg => {
      const json = JSON.parse(msg);
      switch (json.op) {
        case 8: {
          this._debug('Got OP 8, identifying...');
          this.socket.send(JSON.stringify({
            op: 0,
            d: {
              server_id: this.con.guild.id,
              user_id: this.con.guild.client.user.id,
              session_id: this.session,
              token: this.token
            }
          }));
          this._heartbeat();
          this._heartbeatInterval = setInterval(this._heartbeat.bind(this), json.d.heartbeat_interval);
          break;
        }
        case 6: {
          this.lastHBAckAt = Date.now();
          this._debug(`Received heartbeat ack, ping ${this.ping}ms!`);
          break;
        }
        case 2: {
          this._debug('OP 2 received, creating a UDP network!');
          this.ssrc = json.d.ssrc;
          this.con.udp = new UDPNetwork(this.con, json.d.ip, json.d.port);
          break;
        }
        case 4: {
          if (this.ready) break;
          this._debug('Received secret key, audio can be sent now!');
          this.ready = true;
          this.con.udp.secretKey = new Uint8Array(json.d.secret_key);
          this.con._promise.resolve();
          break;
        }
      }
    });
  }

  _debug(message) {
    this.con.guild.client.emit('debug', `[WebSocket/${this.con.guild.id}/${this.con.channel.id}] ${message}`);
  }

  _heartbeat() {
    this.lastHBAt = Date.now();
    this.socket.send(JSON.stringify({ op: 3, d: this.lastHBAt }));
  }

  get ping() {
    if (!this.lastHBAt || !this.lastHBAckAt) return null;
    return this.lastHBAckAt - this.lastHBAt;
  }

  selectProtocol(ip, port) {
    this._debug('Selecting protocol using mode xsalsa20_poly1305');
    this.socket.send(JSON.stringify({
      op: 1,
      d: {
        protocol: 'udp',
        data: {
          address: ip,
          port: port,
          mode: 'xsalsa20_poly1305'
        }
      }
    }));
  }

};
