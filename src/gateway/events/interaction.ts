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

import type { GatewayInteractionCreateDispatchData, APIGuildInteraction, APIDMInteraction, RESTPostAPIInteractionCallbackJSONBody } from 'discord-api-types';
import type { AnyChannel, AnyTextableChannel } from '../../types';
import type { ShardEventProcessor } from '.';
import { InteractionMessage } from '../../entities';
import { Shard } from '../Shard';

export interface ButtonClickContext {
  channel: AnyChannel;
}

export const INTERACTION_CREATE: ShardEventProcessor<GatewayInteractionCreateDispatchData> = async (shard, data) => {
  switch (data.type) {
    case 1:
      shard.debug('Pong! Received interaction thing.');
      break;

    case 2:
      await onSlashCommand(shard, data);
      break;

    // @ts-ignore Not implemented in discord-api-types
    case 3:
      await onButtonOrSelect(shard, data);
      break;

    default:
      shard.debug(`Unhandled interaction event: ${data.type}\n${JSON.stringify(data, null, 2)}`);
  }
};

const onSlashCommand = async (shard: Shard, data: GatewayInteractionCreateDispatchData) => {
  const channel = await shard.client.channels.fetch<AnyTextableChannel>(data.channel_id);

  // Create the interaction response, put it in a thinking state
  await shard.client.createInteractionResponse(data.id, data.token, 5);

  // In a DM, so no guild. :(
  if ((data as any).guild_id === undefined) {
    const d = data as APIDMInteraction;
    const message = new InteractionMessage();

    // The user should handle it with a [DMInteractionMessage]
    shard.client.emit('receiveDMInteraction', message);
  } else {
    const d = data as APIGuildInteraction;
    const message = new InteractionMessage();

    // It's in a guild, so guild data! :D
    shard.client.emit('receiveGuildInteraction', message);
  }
};

const onButtonOrSelect = async (shard: Shard, data: GatewayInteractionCreateDispatchData) => {
  const channel = await shard.client.channels.fetch<AnyTextableChannel>(data.channel_id) as unknown as AnyTextableChannel;
  const isDropdown = Array.isArray((data.data as any).values);

  // Create a interaction response of "thinking"
  await shard.client.createInteractionResponse(data.data.id, data.token, 5);

  // Check if it's a dropdown
  if (isDropdown) {
    const message = new InteractionMessage();
    shard.client.emit('uikit:selectDropdownItem', message);
  } else {
    const message = new InteractionMessage();
    shard.client.emit('uikit:buttonClick', message as any);
  }
};

/*
{
  application_id: '508842721545289731',
  channel_id: '743698927982739530',
  data: { component_type: 3, custom_id: 'select_menus', values: [ 'owo' ] },
  guild_id: '743698927039283201',
  id: '851935977780805653',
  member: {
    avatar: null,
    deaf: false,
    is_pending: false,
    joined_at: '2020-08-14T05:14:01.533000+00:00',
    mute: false,
    nick: 'Noel 🥀',
    pending: false,
    permissions: '137438953471',
    premium_since: null,
    roles: [ '743700026605174805', '779421130959749122' ],
    user: {
      avatar: '2f9c246ad94464de1eddf6125b460f8e',
      discriminator: '5820',
      id: '280158289667555328',
      public_flags: 131840,
      username: 'August'
    }
  },
  message: {
    attachments: [],
    author: {
      avatar: '5e51b30fa089f43678fe5536d2740812',
      bot: true,
      discriminator: '4890',
      id: '508842721545289731',
      public_flags: 0,
      username: 'Aoba'
    },
    channel_id: '743698927982739530',
    components: [ [Object] ],
    content: 'select menus :eyes:',
    edited_timestamp: null,
    embeds: [],
    flags: 0,
    id: '851935970453749801',
    mention_everyone: false,
    mention_roles: [],
    mentions: [],
    pinned: false,
    timestamp: '2021-06-08T21:29:23.561000+00:00',
    tts: false,
    type: 0
  },
  token: 'no :D',
  type: 3,
  version: 1
}
*/
