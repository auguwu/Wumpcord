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

import Util from '.';

/**
 * Represents a [FormData] class to send files to Discord
 */
export default class FormData {
  /** The boundary key for this [FormData] */
  public boundary: string;

  /** The list of chunks to send out */
  #chunks: Buffer[];

  /**
   * Creates a new [FormData] instance
   */
  constructor() {
    this.boundary = '----------------Wumpcord';
    this.#chunks = [];
  }

  /**
   * Appends payload to the form data
   * @param field The field name to set it as
   * @param chunk The chunk to append, can be anything
   * @param filename The file-name, if needed
   */
  async append(field: string, chunk: any, filename?: string) {
    let start = `\r\n${this.boundary}\r\nContent-Disposition: form-data; name="${field}"`;
    if (filename !== undefined)
      start += `;\r\nfilename="${filename}"`;

    // Convert a [Readable] stream to a single Buffer
    if (Util.isReadableStream(chunk))
      chunk = await Util.readableToBuffer(chunk);

    let data!: Buffer;
    if (chunk instanceof Buffer) {
      start += '\r\nContent-Type: application/octet-stream';
      data = chunk;
    } else if (Util.isObject(chunk)) {
      start += '\r\nContent-Type: application/json';
      data = Buffer.from(JSON.stringify(chunk));
    } else {
      data = Buffer.from(String(chunk));
    }

    this.#chunks.push(Buffer.from(`${start}\r\n\r\n`));
    this.#chunks.push(data);
  }

  /**
   * Finishes the [FormData] instance and returns the chunks to send out
   */
  finish() {
    this.#chunks.push(Buffer.from(`--${this.boundary}`));
    return this.#chunks;
  }
}
