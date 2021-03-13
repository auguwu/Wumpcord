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

const { join, sep } = require('path');
const { execSync } = require('child_process');
const _ts = require('typescript');
const fs = require('fs/promises');
const ts = require('ts-morph');

const log = (message) => process.stdout.write(`[docs] ${message}\n`);
const commitHash = execSync('git rev-parse HEAD').toString().trim();

const cwd = process.cwd().split(sep);

async function main() {
  const project = new ts.Project({
    tsConfigFilePath: join(__dirname, '..', 'tsconfig.json')
  });

  const sourceFiles = project.addSourceFilesFromTsConfig(join(__dirname, '..', 'tsconfig.json'));
  log(`Found ${sourceFiles.length} source files to look at!`);

  const classes = [];
  const typeAliases = [];
  const interfaces = [];
  const variables = [];

  for (const sourceFile of sourceFiles) {
    const sourcedClasses = sourceFile.getClasses();
    const sourcedTypes = sourceFile.getTypeAliases();
    const sourcedInterfaces = sourceFile.getInterfaces();
    const sourcedVariables = sourceFile.getVariableDeclarations();

    for (const clazz of sourcedClasses) {
      const jsdoc = clazz.getJsDocs();
      const path = sourceFile.getFilePath().split('/').filter(r => !cwd.includes(r));
      const docs = jsdoc.filter(uwu => !uwu.getInnerText().trim().startsWith('Copyright (c)'));
      const definition = {
        commitUrl: `https://github.com/auguwu/Wumpcord/blob/${commitHash}/${path.join('/')}`,
        generics: [],
        children: [],
        parent: null,
        text: 'No documentation has been written at this time',
        name: clazz.getName()
      };

      for (const line of docs) {
        const text = line.getDescription();
        definition.text = text;

        const params = clazz.getTypeParameters();
        for (const param of params) {
          const name = param.getName();
          const constraint = param.getConstraint();

          definition.generics.push([name, constraint !== undefined ? constraint.getText() : null]);
          definition.name = `${clazz.getName()}<${definition.generics.map(([name, constraint]) => `${name}${constraint !== null ? ` extends ${constraint}` : ''}`).join('\n')}>`;
        }
      }

      const properties = clazz.getProperties();
      const staticMethods = clazz.getStaticMethods();
      const methods = clazz.getMethods();
      const getters = clazz.getGetAccessors();

      for (const property of properties) {
        const line = property.getJsDocs()[0];
        const name = property.getName();
        const rawType = property.getType();

        console.log(rawType.getStringIndexType()?.getText() ?? '<none>');

        if (!line) {
          definition.children.push({
            references: [],
            private: name.startsWith('#') || name.startsWith('_'),
            //value: rawType.getStringIndexType().getText(),
            type: 'property',
            docs: 'No documentation has been written.',
            name
          });

          continue;
        }

        const text = line.getInnerText().trim();
        const matches = text.match(/\[(\w+.)\]/gi);
        const references = matches?.map(match => {
          const $ref = match.slice(1, match.length - 1);
          const [name, ...props] = $ref.split('.');

          if (!name || !props)
            return { props: [], name: $ref };

          return {
            props,
            name
          };
        }) ?? [];

        definition.children.push({
          references,
          private: name.startsWith('#') || name.startsWith('_'),
          type: 'property',
          docs: line.getInnerText().trim(),
          name
        });
      }

      //console.log(definition.children.map(r => r.references));
    }
  }
}

main();
