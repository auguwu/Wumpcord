/**
 * Copyright (c) 2020 August, Ice
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

// todo: this file
const { runCLI } = require('@jest/core');
const { join } = require('path');
const leeks = require('leeks.js');

let original;
function closeAndReopen() {
  original = console;
  console = {
    log: null,
    warn: null,
    error: null,
    debug: null,
    info: null
  };

  //process.stdout.write(null);
  process.stdout.end();

  return () => {
    console = original;
    console.log('test');
  };
}

/**
 * Runs the `test` script
 * @param {boolean} ci If we are in CI mode
 */
async function main(ci) {
  const reopen = closeAndReopen();

  try {
    const { results, globalConfig } = await runCLI({
      ci,
      config: join(__dirname, '..', 'jest.config.js'),
      projects: [process.cwd()],
      silent: true
    }, [process.cwd()]); // HOW THE FUCK DO YOU GET PRINTED WHAT????

    reopen();
    console.log(results);
  } catch(ex) {
    reopen();
    console.error(ex);
  }
}

const args = process.argv.slice(2);
const isCI = args[0] && args[0] === '--ci';

main(isCI);
