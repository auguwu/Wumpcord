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

import type { APIAuditLogEntry, APIAuditLogChange } from 'discord-api-types/v8';
import type { GuildTextableChannel } from '../../types';
import type WebSocketClient from '../../gateway/WebSocketClient';
import { AuditLogAction } from '../../Constants';
import type Message from '../Message';
import Base from '../Base';

export default class AuditLogEntry extends Base<APIAuditLogEntry> {
  /** Number of days after inactive members were kicked (action = Member Prune)  */
  public inactiveMembers?: number;

  /** The amount of members removed from the guild (action = Member Prune) */
  public membersRemoved?: number;

  /** The action type that was executed */
  public actionType!: number;

  /** Number of entities that were targeted (actions = Message Delete, Message Delete Bulk, Member Disconnect, Member Move) */
  public targetCount?: number;

  /** The channel ID for fallback purposes (actions = Message Delete, Message [Un]pin, Member Moved) */
  public channelID?: string;

  /** The message ID for fallback purposes (actions = Message Unpin/Pin) */
  public messageID?: string;

  /** The channel that it occured in, if cached (actions = Message Delete, Message [Un]pin, Member Moved) */
  public channel?: GuildTextableChannel;

  /** The message that was targeted, if cached (actions = Message Unpin and Message Pin) */
  public message?: Message;

  /** The websocket client attached */
  private client: WebSocketClient;

  /** List of changes, if any */
  public changes!: APIAuditLogChange[];

  /** The reason on why it was updated */
  public reason?: string;

  /** The type that the audit log was executed (actions = Channel Overwrite Create/Delete/Update) */
  public type?: 'role' | 'member';

  /** The role name that was updated from the channel overwrite update (actions = Channel Overwrite Create/Delete/Update) */
  public role?: string;

  /** The user who performed the audit log action */
  public user!: any;

  /**
   * Creates a new [AuditLogEntry] instance
   * @param client The WebSocket client attached
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: APIAuditLogEntry) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: APIAuditLogEntry) {
    this.actionType = data.action_type;
    this.changes = data.changes || [];
    this.reason = data.reason;
    this.user = data.user_id;

    // https://discord.com/developers/docs/resources/audit-log#audit-log-entry-object-optional-audit-entry-info
    if (data.options !== undefined) {
      if (this.actionType === AuditLogAction.MemberPrune) {
        this.inactiveMembers = Number(data.options.delete_member_days);
        this.membersRemoved = Number(data.options.members_removed);
      }

      if ([
        AuditLogAction.MemberMove,
        AuditLogAction.MessagePin,
        AuditLogAction.MessageUnpin,
        AuditLogAction.MessageDelete
      ].includes(this.actionType)) {
        this.channelID = data.options.channel_id;
        this.channel = undefined;
      }

      if ([AuditLogAction.MessageUnpin, AuditLogAction.MessagePin].includes(this.actionType)) {
        this.messageID = data.options.message_id;
        this.message = null;
      }

      if ([
        AuditLogAction.MessageDelete,
        AuditLogAction.MessageBulkDelete,
        AuditLogAction.MemberDisconnect,
        AuditLogAction.MemberMove
      ].includes(this.actionType)) {
        this.targetCount = Number(data.options.count);
      }

      if ([
        AuditLogAction.ChannelOverwriteCreate,
        AuditLogAction.ChannelOverwriteDelete,
        AuditLogAction.ChannelOverwriteUpdate
      ].includes(this.actionType)) {
        this.type = data.options.type === '0' ? 'role' : 'member';

        if (data.options.type === '0')
          this.role = data.options.role_name;
      }
    }
  }
}
