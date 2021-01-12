/**
 * Copyright (c) 2020-2021 August, Ice
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

import Permissions from '../src/util/Permissions';
import EventBus from '../src/util/EventBus';
import Util from '../src/util';

describe('Util', () => {
  it('should be `d` if the property isn\'t found', () => {
    const obj = { a: 'b' };

    // @ts-ignore I know it's not found, that's what the test is about.
    expect(Util.get(obj, 'c', 'd')).toStrictEqual('d');
  });

  it('should be `c` if the property is found.', () => {
    const obj = { a: 'c' };

    expect(Util.get(obj, 'a', 'w')).toStrictEqual('c');
  });
});

interface EventBusMap {
  test(message: string): void;
}

describe('EventBus', () => {
  let bus!: EventBus<EventBusMap>;

  beforeAll(() => {
    bus = new EventBus();
  });

  afterEach(() => bus.removeAllListeners());

  it('should return `test` as the message content', () => {
    bus.on('test', (msg) => {
      expect(msg).toStrictEqual('test');
    });

    bus.emit('test', 'test');
  });

  it('should not return `test` as the message content', () => {
    bus.on('test', msg => {
      expect(msg).not.toStrictEqual('test');
    });

    bus.emit('test', 'ea sports');
  });
});

describe('Permissions', () => {
  let permissions: Permissions;

  beforeAll(() => {
    permissions = new Permissions('536211174');
  });

  it('should return `false` if we don\'t have the `administrator` permission', () =>
    expect(permissions.has('administrator')).toBeFalsy()
  );

  it('should return `false` if we provide a invalid permission', () =>
    expect(permissions.has('unknown')).toBeFalsy()
  );

  it('should return a strict JSON blob', () =>
    expect(permissions.toJSON()).toStrictEqual({
      kickMembers: true,
      banMembers: true,
      manageGuild: true,
      addReactions: true,
      viewAuditLogs: true,
      stream: true,
      readMessages: true,
      sendMessages: true,
      manageMessages: true,
      embedLinks: true,
      attachFiles: true,
      readMessageHistory: true,
      externalEmojis: true,
      voiceConnect: true,
      voiceSpeak: true,
      voiceMuteMembers: true,
      voiceDeafenMembers: true,
      voiceMoveMembers: true,
      voiceUseVAD: true,
      changeNickname: true,
      manageNicknames: true,
      manageRoles: true
    })
  );
});
