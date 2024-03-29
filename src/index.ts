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

const { version: pkgVersion } = require('../package.json');

export { default as InteractionClient } from './interactions/InteractionClient';
export { DiscordRestError } from './errors/DiscordRestError';
export { DiscordAPIError } from './errors/DiscordAPIError';
export { default as Client } from './gateway/WebSocketClient';

export * as Constants from './Constants';

export * from './interactions/types';
export * from './events';
export * from './models';
export * from './types';

// export misc types
export { InteractionClientEvents } from './interactions/InteractionClient';
export { WebSocketClientEvents } from './gateway/WebSocketClient';

/** Returns the version of Wumpcord */
export const version: string = pkgVersion;
