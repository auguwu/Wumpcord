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

import type { APIAuditLog } from 'discord-api-types/v8';
import type WebSocketClient from '../../gateway/WebSocketClient';
import GuildIntegration from '../guild/GuildIntegration';
import AuditLogEntry from './AuditLogEntry';
import { Webhook } from '../Webhook';
import { User } from '../User';

export default class AuditLogs {
  /** List of intergrations affected in the audit logs */
  public integrations!: GuildIntegration[];

  /** The [WebSocketClient] attached */
  private client: WebSocketClient;

  /** List of webhooks affected in the audit logs */
  public webhooks!: Webhook[];

  /** List of available entries */
  public entries!: AuditLogEntry[];

  /** Any users affected in the audit logs */
  public users!: User[];

  /**
   * Creates a new [AuditLogEntry] instance
   * @param client The WebSocket client attached
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: APIAuditLog) {
    this.client = client;
    this.patch(data);
  }

  private patch(data: APIAuditLog) {
    this.integrations = data.integrations.map(integration => new GuildIntegration(this.client, integration));
    this.webhooks = data.webhooks.map(webhook => new Webhook(this.client, webhook));
    this.entries = data.audit_log_entries.map(data => new AuditLogEntry(this.client, data));
    this.users = data.users.map(user => this.client.users.add(new User(this.client, user)));
  }
}
