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

const WebSocketNetwork = require('./networks/WebSocket');
const getConverter = require('./converters/getConverter');

/**
 * Represents the actual voice connection with Discord and us
 */
module.exports = class VoiceConnection {
  /**
   * Represents a [VoiceConnection]
   * @param {import('../entities/Guild')} guild The guild we're connected to
   * @param {import('../entities/channel/VoiceChannel')} channel The channel we're connected to
   */
  constructor(guild, channel) {
    /**
     * The guild we are connected to
     * @type {import('../entities/Guild')}
     */
    this.guild = guild;

    /**
     * The current voice channel we are in
     * @type {import('../entities/channel/VoiceChannel')}
     */
    this.channel = channel;

    /**
     * The UDP connection from Discord
     * @type {import('./networks/UDP')}
     */
    this.udp = null;

    /**
     * The current WebSocket connection from Discord
     * @type {import('./networks/WebSocket')}
     */
    this.ws = new WebSocketNetwork(this);

    /**
     * The bot is speaking in a voice channel
     * @type {boolean}
     */
    this.speaking = false;

    /**
     * The current interval to send packets
     * @type {NodeJS.Timeout}
     */
    this.playbackInterval = null;

    /**
     * Represents a converter to convert anyhting to Opus audio
     * @type {import('./converters/Converter')}
     */
    this.converter = null;

    this.ready = new Promise((resolve, reject) => {
      this._promise = { resolve, reject };
    });
  }

  /**
   * Provides a voice state update to the WS network
   * @param voiceStateUpdate
   * @private
   */
  _doVoiceStateUpdate(voiceStateUpdate) {
    this._debug('Received a voice state update!');
    this.ws._cacheState(voiceStateUpdate);
  }

  /**
   * Provides a voice server update to the UDP network
   * @param voiceServerUpdate
   * @private
   */
  _doVoiceServerUpdate(voiceServerUpdate) {
    this._debug('Received voice server update!');
    this.ws._spawn(voiceServerUpdate);
  }

  _debug(message) {
    this.guild.client.emit('debug', `[VoiceConnection/${this.guild.id}/${this.channel.id}] ${message}`);
  }

  /**
   * Speaks in the channel
   */
  speak() {
    this.speaking = !this.speaking;
    this.ws.socket.send(JSON.stringify({
      op: 5,
      d: {
        speaking: this.speaking ? 1 << 0 : 0,
        delay: 0,
        ssrc: this.ws.ssrc
      }
    }));
  }

  /**
   * Plays an audio stream to Discord
   * @param {NodeJS.ReadableStream | string} source The source of the stream, can be a file path or a Opus stream, or a PCM stream.
   * @param {boolean} replace Whether to replace the current stream
   * @returns {Promise<void>} A promise of nothing
   */
  async play(source, replace = false) {
    if (!replace && this.converter && !this.converter.ended && this.converter.packets.length > 0) throw new Error('Already playing from a stream.');
    if (!this.ws.ready) throw new Error('UDP/WS isn\'t ready');
    if (!this.speaking) this.speak(true);
    this.converter = await getConverter(this, source);
    if (!this.converter) throw new Error('Failed to get a converter. The stream must be a file path, Opus stream, or PCM stream.');

    const i = setInterval(() => {
      // Even though the converter ended, this doesn't mean the packet queue isn't empty
      // So we have to also make sure the packet queue is empty, before we stop
      if (this.converter.ended && this.converter.packets.length < 1) return clearInterval(i);
      const packet = this.converter.provide();
      if (!packet) return;

      this.udp.sendPacket(packet);
    }, 20);
    i.unref();
  }
};
