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
import { Shard } from '../Shard';

export interface ButtonClickContext {
  channel: AnyChannel;
}

export const INTERACTION_CREATE: ShardEventProcessor<GatewayInteractionCreateDispatchData> = async (shard, data) => {
  console.log(data);
  switch (data.type) {
    case 1:
      shard.debug('Pong! Received interaction thing.');
      break;

    case 2:
      await onSlashCommand(shard, data);
      break;

    // @ts-expect-error Not implemented in discord-api-types
    case 3:
      await onButtonClick(shard, data);
      break;

    default:
      shard.debug(`Unhandled interaction event: ${data.type}\n${JSON.stringify(data, null, 2)}`);
  }
};

const onSlashCommand = async (shard: Shard, data: GatewayInteractionCreateDispatchData) => {
  const channel = await shard.client.channels.fetch<AnyTextableChannel>(data.channel_id);

  // In a DM, so no guild. :(
  if ((data as any).guild_id === undefined) {
    const d = data as APIDMInteraction;

    // Create the interaction response, put it in a thinking state
    await shard.client.rest.dispatch<RESTPostAPIInteractionCallbackJSONBody>({
      endpoint: '/interactions/:id/:token/callback',
      method: 'POST',
      data: { type: 5 }
    });

    // The user should handle it with a [DMInteractionMessage]
    shard.client.emit('receiveDMInteraction', null);
  } else {
    // It's in a guild, so guild data! :D
    shard.client.emit('receiveGuildInteraction', null);
  }
};

const onButtonClick = async (shard: Shard, data: GatewayInteractionCreateDispatchData) => {
  const channel = await shard.client.channels.fetch<AnyTextableChannel>(data.channel_id);

  // Ack a response
  await shard.client.rest.dispatch<RESTPostAPIInteractionCallbackJSONBody>({
    endpoint: '/interactions/:id/:token/callback',
    method: 'POST',
    data: { type: 5 }
  });

  // Emit the event
  shard.client.emit('buttonClick', {
    channel
  });
};
