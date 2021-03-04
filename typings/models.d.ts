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

import * as discord from 'discord-api-types';
import * as core from '.';

declare class Entity<T extends object = {}> {
  /**
   * Creates a new [Entity] instance
   * @param id The snowflake ID from Discord
   */
  constructor(id?: string);

  /** The entity's ID */
  public id: string;

  /** DateTime of when the entity was created */
  public createdAt: Date;

  /**
   * Patch this [Entity] with new data, useful for updating
   * @param data The data to use
   */
  public patch?(data: T): void;
}

// src/models/audits
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}

// src/models/channel
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}

// src/models/guild
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}

// src/models/presence
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}

// src/models/teams
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}

// src/models
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
declare class AuditLogEntry extends Entity<discord.APIAuditLogEntry> {}
