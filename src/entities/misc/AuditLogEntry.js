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

const { AuditLogActions } = require('../../Constants');
const Base = require('../Base');

module.exports = class AuditLogEntry extends Base {
  /**
   * Creates a new [AuditLogEntry] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {AuditLogEntryPacket} data The data
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client instance
     * @private
     * @type {import('../../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches data for this [AuditLogEntry] instance
   * @param {AuditLogEntryPacket} data The data
   */
  patch(data) {
    /**
     * The changes available for this [AuditLogEntry], if any
     * @type {AuditLogEntryChange[]}
     */
    this.changes = data.changes || [];

    /**
     * The action type
     * @type {number}
     */
    this.actionType = data.action_type;

    /**
     * The user who did the audit log
     * @type {import('../User') | null}
     */
    this.user = this.client.users.get(data.user_id) || null;

    /**
     * The reason of the audit log change
     * @type {?string}
     */
    this.reason = data.reason;

    // partial options dependant on the audit log change
    // docs: https://discord.com/developers/docs/resources/audit-log#audit-log-entry-object-optional-audit-entry-info
    if (data.options !== undefined) {
      if (this.actionType === AuditLogActions.MemberPrune) {
        /**
         * Number of days after inactive members were kicked
         * @type {number}
         */
        this.deleteMemberDays = Number(data.options.delete_member_days);

        /**
         * The amount of members removed from the guild
         * @type {number}
         */
        this.membersRemoved = Number(data.options.members_removed);
      }

      if ([
        AuditLogActions.MemberMove,
        AuditLogActions.MessagePin,
        AuditLogActions.MessageUnpin,
        AuditLogActions.MessageDelete
      ].includes(this.actionType)) {
        /**
         * The channel that it occured in
         * @type {import('../BaseChannel') | null}
         */
        this.channel = this.client.channels.get(data.options.channel_id);

        /**
         * The channel ID
         * @type {string}
         */
        this.channelID = data.options.channel_id;
      }

      if ([AuditLogActions.MessageUnpin, AuditLogActions.MessagePin].includes(this.actionType)) {
        /**
         * The message that was targeted
         * @type {import('../Message') | null}
         */
        this.message = this.channel !== null && this.channel.type === 'text' ? this.channel.messages.get(data.options.message_id) : null;
        
        /**
         * The message ID
         * @type {string}
         */
        this.messageID = data.options.message_id;
      }

      if ([
        AuditLogActions.MessageDelete,
        AuditLogActions.MessageBulkDelete,
        AuditLogActions.MemberDisconnect,
        AuditLogActions.MemberMove
      ].includes(this.actionType)) {
        /**
         * Number of entities that were targeted
         * @type {number}
         */
        this.targetCount = Number(data.options.count);
      }

      if ([
        AuditLogActions.ChannelOverwriteCreate,
        AuditLogActions.ChannelOverwriteDelete,
        AuditLogActions.ChannelOverwriteUpdate
      ].includes(this.actionType)) {
        /**
         * The type
         * @type {'role' | 'member'}
         */
        this.type = data.options.type === '0'
          ? 'role'
          : 'member';

        /**
         * The role name if [AuditLogEntry.type] is `role`
         * @type {?string}
         */
        this.role = this.type === 'role' ? data.options.role_name : null;
      }
    }
  }
};

/**
 * @typedef {object} AuditLogEntryChange
 * @prop {any} old_value
 * @prop {any} new_value
 * @prop {string} key
 *
 * @typedef {object} AuditLogEntryPacket
 * @prop {number} action_type
 * @prop {string} [target_id]
 * @prop {string} user_id
 * @prop {AuditLogEntryChange[]} changes
 * @prop {string} id
 */
