import WebSocketClient, { WebSocketClientEvents } from '../gateway/WebSocketClient';
import InteractionCreateEvent from '../events/interaction/InteractionCreateEvent';
import InteractionHelper from './Helper';
import { ClientOptions } from '../types';

export interface InteractionClientEvents extends WebSocketClientEvents {
  interactionReceive(event: InteractionCreateEvent): void;
}

export default class InteractionClient<
  Options extends ClientOptions = ClientOptions,
  Events extends InteractionClientEvents = InteractionClientEvents
> extends WebSocketClient<Options, Events> {
  /** The interactions helper */
  public readonly interactions: InteractionHelper = new InteractionHelper(this);
}
