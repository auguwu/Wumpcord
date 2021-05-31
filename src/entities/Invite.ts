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

import { ChannelTypes, InviteTargetType } from '../Constants';
import type { APIGuild, APIInvite } from 'discord-api-types';
import type { WebSocketClient } from '../Client';
import { Application } from './Application';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Channel } from './Channel';

interface InviteChannel {
  recipients?: { username: string }[];
  type: Exclude<ChannelTypes, 1 | 4>;
  name: string | null;
  id: string;
}

type InviteCriteria = 'withMetadata' | 'withCount' | 'withExpiration' | Without<'withMetadata' | 'withCount' | 'withExpiration'>;
type Without<K extends string> = K extends string
  ? K extends `with${infer P}`
    ? `without${P}`
    : K
  : never;

function getQueryParams(withCounts?: boolean, withExpiration?: boolean) {
  let str = '';

  // i know, this looks bad
  // TODO: make this look better i think
  if (withCounts === true) {
    str += '?with_counts=true';
    return str;
  } else if (withCounts as any === true && withExpiration === true) {
    str += '?with_counts=true&with_expiration=true';
  } else if (withCounts === false && withExpiration === true) {
    str += '?with_expiration=true';
    return str;
  } else {
    return str;
  }
}

/**
 * https://discord.com/developers/docs/resources/invite
 */
export class Invite<
  M extends InviteCriteria = 'withoutMetadata' | 'withoutCount' | 'withoutExpiration',
  C extends InviteChannel = InviteChannel
> extends BaseEntity<APIInvite> {
  /**
   * The approximate online users available, it'll return nothing if it
   * wasn't fetched using [Guild.fetchInvite] with the `withCount` option being true.
   */
  public approximatePresenceCount?: M extends 'withCount'
    ? number
    : never;

  /**
   * The approximate member count, it'll return nothing if it
   * wasn't fetched using [Guild.fetchInvite] with the `withCount` option being true.
   */
  public approximateMemberCount?: M extends 'withCount'
    ? number
    : never;

  /**
   * A date of when this invite was created by the inviter.
   */
  public wasCreatedAt?: M extends 'withMetadata'
    ? Date
    : never;

  /**
   * Date of when this invite expires, returns `null` if it doesn't expire. This
   * will return nothing if it wasn't fetched using [Guild.fetchInvite] with the
   * `withExpiration` option being true.
   */
  public expiresAt?: M extends 'withExpiration'
    ? Date | null
    : never;

  /**
   * If the invite grants temporary membership access
   */
  public temporary?: M extends 'withMetadata'
    ? number
    : never;

  /**
   * The max uses this invite has
   */
  public maxUses?: M extends 'withMetadata'
    ? number
    : never;

  /**
   * Duration in seconds of the max age of this invite before expiring.
   */
  public maxAge?: M extends 'withMetadata'
    ? number
    : never;

  /**
   * Number of times this invite has been used.
   */
  public uses!: M extends 'withMetadata'
    ? number
    : never;

  /**
   * The embedded application to open for this voice channel's
   * embedded application invite.
   */
  public targetApplication?: Application;

  /**
   * The user whose strem to display for this voice channel stream invite.
   */
  public targetUser?: User;

  /**
   * The client attached to this invite
   */
  private client: WebSocketClient;

  /**
   * The type of target for this voice channel invite
   */
  public targetType?: InviteTargetType;

  /**
   * The user who created htis invite
   */
  public inviter?: User;

  /**
   * The channel this invite is for
   */
  public channel!: C;

  /**
   * The guild this invite is for
   */
  public guild?: APIGuild;

  /**
   * The invite code (unique ID)
   */
  public code!: string;

  constructor(client: WebSocketClient, data: APIInvite) {
    super();

    this.client = client;
    this.patch(data);
  }

  patch(data: Partial<APIInvite>) {
    if (data.approximate_presence_count !== undefined)
      this.approximatePresenceCount = data.approximate_presence_count as any;

    if (data.approximate_member_count !== undefined)
      this.approximateMemberCount = data.approximate_member_count as any;

    if (data.target_application !== undefined)
      this.targetApplication = new Application(this.client, data.target_application as any);

    if (data.target_type !== undefined)
      this.targetType = data.target_type as number;

    if (data.target_user !== undefined)
      this.targetUser = this.client.users.put(new User(this.client, data.target_user));

    if (data.expires_at !== undefined)
      this.expiresAt = data.expires_at !== null ? <any> new Date(data.expires_at) : null;

    if (data.inviter !== undefined)
      this.inviter = this.client.users.put(new User(this.client, data.inviter));

    if (data.channel !== undefined)
      this.channel = this.client.channels.put(Channel.from(this.client, data.channel)!);

    if (data.code !== undefined)
      this.code = data.code;
  }

  /**
   * Retrieve this invite and patches this invite with new data.
   * @param withCounts If we should include the `with_counts` query param.
   */
  fetch(withCounts?: false): Promise<Invite>;

  /**
   * Retrieve this invite and patches this invite with new data.
   * @param withCounts If we should include the `with_counts` query param.
   * @param withExpiration If we should include the `with_expiration` query param
   */
  fetch(withCounts: true, withExpiration: true): Promise<Invite<'withCount' | 'withExpiration' | 'withMetadata'>>;

  /**
   * Retrieve this invite and patches this invite with new data.
   * @param withCounts If we should include the `with_counts` query param.
   * @param withExpiration If we should include the `with_expiration` query param
   */
  fetch(withCounts: false, withExpiration: false): Promise<Invite>;

  /**
   * Retrieve this invite and patches this invite with new data.
   * @param withCounts If we should include the `with_counts` query param.
   * @param withExpiration If we should include the `with_expiration` query param
   */
  fetch(withCounts: false, withExpiration: true): Promise<Invite<'withExpiration' | 'withMetadata'>>;

  /**
   * Retrieve this invite and patches this invite with new data.
   * @param withCounts If we should include the `with_counts` query param.
   * @param withExpiration If we should include the `with_expiration` query param
   */
  fetch(withCounts: true, withExpiration?: false): Promise<Invite<'withCount' | 'withMetadata'>>;
  fetch(withCounts?: boolean, withExpiration?: boolean): Promise<any> {
    const queryParams = getQueryParams(withCounts, withExpiration);

    return this.client.rest.dispatch<never, APIInvite>({
      endpoint: `/invites/${this.code}${queryParams}`,
      method: 'GET'
    }).then(data => new Invite(this.client, data));
  }

  /**
   * Deletes the invite
   */
  delete() {
    return this.client.rest.dispatch<never, boolean>({
      endpoint: '/invites/:code',
      method: 'DELETE',
      query: { code: this.code }
    })
      .then(() => true);
  }
}
