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

/**
 * List of close codes available for the voice module
 */
export const enum CloseCodes {
  Unknown = 4001,
  FailedPayload,
  NotAuthenicated,
  AuthFailed,
  AlreadyAuthenicated,
  SessionInvalid,
  SessionTimeout = 4009,
  ServerNotFound = 4011,
  UnknownProtocol,
  Disconnected = 4014,
  VoiceServerCrash,
  UnknownEncryption
}

/**
 * List of OPCodes available for the voice module
 */
export const enum OPCodes {
  Identify,
  SelectProtocol,
  Ready,
  Heartbeat,
  SessionDescription,
  Speaking,
  HeartbeatAck,
  Resume,
  ClientDisconnect = 13
}

/**
 * List of encryption modes available to use
 */
export const EncryptionModes: [
  normal: string,
  suffix: string,
  lite: string
] = [
  'xsalsa20_poly1305', // Normal
  'xsalsa20_poly1305_suffix', // Suffix
  'xsalsa20_poly1305_lite' // Lite
];

/**
 * List of unrecoverable codes
 */
export const UnrecoverableCodes = [
  4014, // Disconnected
  4006, // Session Invalid
  4003, // Not Authenicated
  4004, // Auth Failed
  1000  // yes
];
