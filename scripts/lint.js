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

const { ESLint } = require('eslint');
const { join } = require('path');

const log = (message) => process.stdout.write(`[lint] ${message}\n`);

async function main() {
  const linter = new ESLint({
    overrideConfigFile: join(__dirname, '..', '.eslintrc.json'),
    extensions: ['js', 'ts'],
    ignorePath: join(__dirname, '..', '.eslintignore'),
    fix: true
  });

  log('linting files from `src`...');
  const results = await linter.lintFiles('src');
  const errors = results.reduce((acc, curr) => acc + curr.errorCount, 0);
  const warnings = results.reduce((acc, curr) => acc + curr.warningCount, 0);

  log(`Received ${errors} errors and ${warnings} warnings`);
}

main();
