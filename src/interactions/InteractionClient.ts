import WebSocketClient from '../gateway/WebSocketClient';
import InteractionHelper from './Helper';

export default class InteractionClient extends WebSocketClient {
  /** The interactions helper */
  public readonly interactions = new InteractionHelper(this);
}
