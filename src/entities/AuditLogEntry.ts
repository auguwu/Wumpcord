/**
 * Copyright (c) 2020-2021 August
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

import type { APIAuditLogEntry, APIAuditLogChange } from 'discord-api-types';
import type { GuildTextableChannel } from './GuildTextableChannel';
import type { WebSocketClient } from '../Client';
import { AuditLogAction } from '../Constants';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

/**
 * https://discord.com/developers/docs/resources/audit-log#audit-log-entry-object
 */
export class AuditLogEntry extends BaseEntity<APIAuditLogEntry> {
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

  /** The websocket client attached */
  private client: WebSocketClient;

  /** List of changes, if any */
  public changes?: APIAuditLogChange[];

  /** The reason on why it was updated */
  public reason?: string;

  /** The type that the audit log was executed (actions = Channel Overwrite Create/Delete/Update) */
  public type?: 'role' | 'member';

  /** The role name that was updated from the channel overwrite update (actions = Channel Overwrite Create/Delete/Update) */
  public role?: string;

  /** The user who performed the audit log action */
  public user!: string | null;

  constructor(client: WebSocketClient, data: APIAuditLogEntry) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  /**
   * Returns the channel that this audit log entry occured in.
   * This can be null if the proper action type isn't:
   *
   * - Member Move
   * - Message Pin
   * - Message Unpin
   * - Message Delete
   */
  get channel() {
    if (!this.channelID)
      return undefined;

    return this.client.channels.get<GuildTextableChannel>(this.channelID);
  }

  patch(data: Partial<APIAuditLogEntry>) {
    if (data.action_type !== undefined)
      this.actionType = data.action_type;

    if (data.changes !== undefined)
      this.changes = data.changes;

    if (data.reason !== undefined)
      this.reason = data.reason;

    if (data.user_id !== undefined)
      this.user = data.user_id;

    if (data.options !== undefined) {
      if (this.actionType === AuditLogAction.MemberPrune) {
        this.inactiveMembers = Number(data.options.delete_member_days);
        this.membersRemoved  = Number(data.options.members_removed);
      }

      if ([
        AuditLogAction.MemberMove,
        AuditLogAction.MessagePin,
        AuditLogAction.MessageUnpin,
        AuditLogAction.MessageDelete
      ].includes(this.actionType)) {
        this.channelID = data.options.channel_id;
      }

      if ([AuditLogAction.MessagePin, AuditLogAction.MessageUnpin].includes(this.actionType)) {
        this.messageID = data.options.message_id;
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
        if (this.type === 'role')
          this.role = data.options.role_name;
      }
    }
  }
}
