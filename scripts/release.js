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

const { promises: fs } = require('fs');
const { exec } = require('child_process');
const { join } = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (message) => process.stdout.write(`[release] ${message}\n`);

async function main() {
  console.log('[release] Preparing for release...');
  await sleep(3000);

  log('linting files...');
  try {
    await require('./lint');
    await sleep(1500);
  } catch(ex) {
    log(ex.message);
    process.exit(1);
  }

  log('running tests...');
  try {
    await require('./test');
    await sleep(1500);
  } catch(ex) {
    log(ex.message);
    process.exit(1);
  }

  log('re-building typings for documentation...');
  try {
    await require('./docs');
    await sleep(1500);
  } catch(ex) {
    log(ex.message);
    process.exit(1);
  }

  log('prepared everything for release.');
}

main();
