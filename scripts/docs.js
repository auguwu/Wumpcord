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

const { existsSync } = require('fs');
const { join, sep } = require('path');
const { execSync } = require('child_process');
const _ts = require('typescript');
const fs = require('fs/promises');
const ts = require('ts-morph');

const log = (message) => process.stdout.write(`[docs] ${message}\n`);
const commitHash = execSync('git rev-parse HEAD').toString().trim();

const cwd = process.cwd().split(sep);

/**
 * Checks if a [PropertyDeclaration] is private or not
 * @param {ts.PropertyDeclaration} node The node
 */
const isPrivate = (node) => {
  const name = node.getName();

  // Support private accessors in property names
  if (name.startsWith('#') || name.startsWith('_'))
    return true;

  // Check the flags of the node
  const modifiers = node.getModifiers();
  const hasPrivateFlag = modifiers.filter(node => node.getKindName() === 'PrivateKeyword');

  return hasPrivateFlag.length > 0;
};

const ImportRegex = /import\("[\w/:]+"\)\./gmi;
const getTypeName = (str) => {
  return str.replaceAll(ImportRegex, '');
};

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

          definition.generics.push([name, constraint !== undefined ? getTypeName(constraint.getText()) : null]);
        }
      }

      const signatures = clazz.getConstructors();
      const properties = clazz.getProperties();
      const staticMethods = clazz.getStaticMethods();
      const methods = clazz.getMethods();
      const getters = clazz.getGetAccessors();

      for (const signature of signatures) {
        const jsdoc = signature.getJsDocs()[0]?.getInnerText().trim().split('\n').shift() ?? 'No documentation has been written for this constructor signature.';
        const params = signature.getParameters();

        const name = `${clazz.getName()}${definition.generics.map(([name, constraint]) => `${name}${constraint !== null ? ` extends ${constraint}` : ''}`).map((val, index) => `${index === 0 ? '<' : ''}${val}${index + 1 === definition.generics.length ? '>' : ''}`).join(', ')}`;
        const listParams = [];

        for (const param of params) {
          const name = param.getName();
          const type = param.getType();

          const typeName = type.getText(param, _ts.TypeFormatFlags.NoTruncation | _ts.TypeFormatFlags.WriteArrayAsGenericType);
          listParams.push(`${name}: ${getTypeName(typeName) ?? 'unknown'}`);
        }

        definition.children.push({
          type: 'constructor',
          docs: jsdoc,
          name: `new ${name}(${listParams.join(', ')});`
        });
      }

      for (const property of properties) {
        const line = property.getJsDocs()[0];
        const name = property.getName();
        const type = property.getType();
        const typeName = type.getText(property, _ts.TypeFormatFlags.NoTruncation | _ts.TypeFormatFlags.WriteArrayAsGenericType);

        if (!line) {
          definition.children.push({
            references: [],
            private: isPrivate(property),
            value: typeName,
            type: 'property',
            docs: 'No documentation has been written.',
            name
          });

          continue;
        }

        const text = line.getInnerText().trim();
        const matches = text.match(/\[(\w+.)\]/gi);

        definition.children.push({
          references: matches?.map(s => s.slice(1, s.length - 1).trim()) ?? [],
          private: isPrivate(property),
          value: typeName,
          type: 'property',
          docs: line.getInnerText().trim(),
          name
        });
      }

      classes.push(definition);
    }

    for (const typeAlias of sourcedTypes) {
      const jsdoc = typeAlias.getJsDocs()[0]?.getInnerText().trim() ?? 'No documentation has been written for this type alias.';
      const name = typeAlias.getName();
      const type = typeAlias.getType();

      typeAliases.push({
        docs: jsdoc,
        name
      });
    }
  }

  //console.log(typeAliases);

  const block = [
    '<!--',
    'DO NOT EDIT THIS FILE, THIS IS AUTOGENERATED USING THE `docs` NPM SCRIPT',
    `Updated At: ${new Date().toLocaleDateString()}`,
    '-->',
    '',
    '# Wumpcord',
    '> Documentation for Wumpcord. A prettier UI for this a work in progress and coming soon!',
    '',
    '> Note: If anything starts with **API**, **Gateway**, or **REST**, it\'ll be in reference to [discord-api-types](https://github.com/discordjs/discord-api-types).',
    ''
  ];

  for (let i = 0; i < classes.length; i++) {
    const klazz = classes[i];
    const children = klazz.children.filter(child => child.type === 'property' ? !child.private : true);

    block.push(
      `# class [${klazz.name.trim()}](${klazz.commitUrl})`,
      klazz.text.trim(),
      ''
    );

    const properties = children.filter(child => child.type === 'property');
    const constructors = children.filter(child => child.type === 'constructor');

    for (const [index, construct] of withIndex(constructors)) {
      if (index === 0)
        block.push('## Constructors');

      block.push(
        `> ${construct.docs.trim()}`,
        '',
        '```js',
        construct.name,
        '```',
        ''
      );
    }

    for (const [index, property] of withIndex(properties)) {
      const className = klazz.name.trim();
      const name = property.name.trim();

      if (index === 0)
        block.push('## Properties');

      block.push(`- **${className}.${name}** -> ${property.value.trim()} ~ ${property.docs.trim()}`);
    }

    block.push('');
  }

  if (!existsSync(join(__dirname, '..', 'docs', 'main.md')))
    await fs.writeFile(join(__dirname, '..', 'docs', 'main.md'), '');

  await fs.writeFile(join(__dirname, '..', 'docs', 'main.md'), block.join('\n'));
  log(`Wrote documentation in ${join(__dirname, '..', 'docs', 'main.md')}.`);
}

function * withIndex(array) {
  for (let i = 0; i < array.length; i++)
    yield [i, array[i]];
}

main();
