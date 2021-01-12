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

const { exec } = require('child_process');
const { join } = require('path');

const log = (message) => process.stdout.write(`[build] ${message}\n`);

async function main(ci) {
  log('starting build...');
  log(`ci: ${ci ? 'yes' : 'no'}`);

  const args = ci ? ['--noEmit'] : [];
  const child = exec(`tsc ${args.join(' ')}`, { cwd: join(__dirname, '..') });
  log(`started child process as ${child.pid}`);

  let success = true;
  child.stdout.on('data', chunk => log(chunk));
  child.stderr.on('data', chunk => log(chunk));
  child.on('error', error => {
    log('unable to build source');
    log(error.stack);

    success = false;
  });

  child.once('exit', (code, signal) => {
    success = code === 0;

    log(`\`tsc\` has closed with code ${code}${signal ? ` with signale "${signal}"` : ''}, success: ${success ? 'yes' : 'no'}`);
    process.exit(success ? 0 : 1);
  });
}

const args = process.argv.slice(2);
const isCi = args[0] === '--ci' || args[0] === '-c';

main(isCi);
