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
 * Functions that would be prefixed with `is` but they aren't.
 */

/**
 * Checks if `buffer` has the PNG signature which is a 8 byte signature
 * @param buffer The buffer to check
 */
export const png = (buffer: Buffer) => {
  // if the buffer length is not over 8
  if (buffer.length < 8)
    return false;

  // RFC: https://tools.ietf.org/html/rfc2083
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  );
};

/**
 * Checks if `buffer` has the JPG signature, which is a 3 byte signature
 * @param buffer The buffer to check
 */
export const jpg = (buffer: Buffer) => {
  // if the buffer length is not over 3
  if (buffer.length < 3)
    return false;

  // https://en.wikipedia.org/wiki/JPEG
  return (
    buffer[0] === 255 &&
    buffer[1] === 216 &&
    buffer[2] === 255
  );
};

/**
 * Check if `buffer` has the GIF signature, which is a 4 byte signature
 * @param buffer The buffer to check
 */
export const gif = (buffer: Buffer) => {
  if (!buffer)
    return false;

  return (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  );
};
