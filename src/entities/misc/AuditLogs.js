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

const { Collection } = require('@augu/immutable');
const AuditLogEntry = require('./AuditLogEntry');
const User = require('../User');

module.exports = class AuditLogs {
  /**
   * Creates a new [AuditLogs] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {AuditLogsPacket} data The data for [AuditLogs]
   */
  constructor(client, data) {
    /**
     * The list of entries available, if they can be cached
     * @type {Collection<AuditLogEntry>}
     */
    this.entries = client.canCache('audit:entries') ? new Collection() : null;

    /**
     * The client instance
     * @private
     * @type {import('../../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches the data for this [AuditLogs]
   * @param {AuditLogsPacket} data The data
   */
  patch(data) {
    /**
     * The users when fetched this audit log
     * @type {Array<import('../User')>}
     */
    this.users = data.users.map(user => this.client.canCache('user') ? this.client.users.get(user.id) || new User(this.client, user) : new User(this.client, user));

    /**
     * List of integrations
     * @type {Array<any>}
     */
    this.integrations = data.integrations || [];

    /**
     * List of webhooks when fetched this audit logs
     * @type {Array<any>}
     */
    this.webhooks = data.webhooks || [];

    if (this.client.canCache('audit:entries')) {
      for (let i = 0; i < data.audit_log_entries.length; i++) {
        const entry = data.audit_log_entries[i];
        this.entries.set(entry.id, new AuditLogEntry(this.client, entry));
      }
    }
  }

  /**
   * Gets a list of entries by the user
   * @param {string} userID The user's ID
   * @returns {AuditLogEntry[]} An array of entries by the user
   */
  getEntriesByUser(userID) {
    if (!this.client.canCache('audit:entries')) return [];

    return this.entries.filter(entry => entry.user && entry.user.id === userID) || [];
  }
};

/**
 * @typedef {object} AuditLogsPacket
 * @prop {import('./AuditLogEntry').AuditLogEntryPacket[]} audit_log_entries
 * @prop {any[]} integrations
 * @prop {any[]} webhooks
 * @prop {import('../User').UserPacket[]} users
 */
