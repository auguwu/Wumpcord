import WebSocketClient, { WebSocketClientEvents } from '../gateway/WebSocketClient';
import InteractionHelper from './Helper';
import { ClientOptions } from '../types';
import InteractionCreateEvent from '../events/interaction/InteractionCreateEvent';

export interface InteractionClientEvents extends WebSocketClientEvents {
  interactionReceive(event: InteractionCreateEvent): void;
}

export default class InteractionClient<
  Options extends ClientOptions = ClientOptions,
  Events extends InteractionClientEvents = InteractionClientEvents
> extends WebSocketClient<Options, Events> {
  /** The interactions helper */
  public readonly interactions = new InteractionHelper(this);
}
