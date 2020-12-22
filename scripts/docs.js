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

const { promises: fs } = require('fs');
const { join } = require('path');
const ts = require('typescript');

const log = (message) => process.stdout.write(`[docs] ${message}\n`);
const readdir = async (path) => {
  let results = [];
  const files = await fs.readdir(path);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stats = await fs.lstat(join(path, file));

    if (stats.isDirectory()) {
      const r = await readdir(join(path, file));
      results = results.concat(r);
    } else {
      results.push(join(path, file));
    }
  }

  return results;
};

const cwd = join(__dirname, '..', 'src');
async function main() {
  const results = {
    classes: [],
    interfaces: [],
    types: [],
    module: 'Wumpcord'
  };

  const files = await readdir(cwd);
  log('Creating program....');

  // Create a TypeScript program to get type checking and other stuff
  const libraries = ['ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', 'ESNext'];
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    lib: libraries.map(lib => `lib.${lib.toLowerCase()}.d.ts`),
    declaration: false,
    strict: true,
    noEmit: true,
    noImplicitAny: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    types: ['node'],
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true
  });

  const sources = program.getSourceFiles();
  const checker = program.getTypeChecker();

  log(`Reviewing ${sources.length} source files...`);

  for (let i = 0; i < sources.length; i++) {
    const sourceFile = sources[i];

    if (!sourceFile.isDeclarationFile && !sourceFile.fileName.includes('lib.') && !sourceFile.fileName.includes('@types')) {
      ts.forEachChild(sourceFile, (node) => visit(node, checker, results));
    }
  }

  console.log(results.classes[0].signature);
}

/**
 * @param {ts.Node} node
 * @param {ts.TypeChecker} checker
 * @param {any} results
 * @param {boolean} [child=false] If the node is a children component
 */
function visit(
  node,
  checker,
  results,
  child = false
) {
  const children = node.getChildren();
  if (children.length > 0) ts.forEachChild(node, (n) => visit(n, checker, results, true));

  if (child) {
    const parentEl = findParent(node, results);
    if (parentEl === null) return;

    // console.log(`parent element for node: ${parentEl[0]}`, '\n', parentEl[1]);
  }

  if (ts.isClassDeclaration(node)) {
    const name = node.name.getText() || '<anonymous class>';
    const symbol = checker.getSymbolAtLocation(node.name);
    if (!symbol) {
      log(`reference symbol at ${name} (${node.getSourceFile().fileName}) couldn't be found.`);
      return;
    }

    const sourceFile = node.getSourceFile();
    const result = {
      signature: {},
      path: sourceFile.fileName,
      name
    };

    const constructType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    const signatures = constructType.getConstructSignatures();

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];
      const documentation = ts.displayPartsToString(signature.getDocumentationComment(checker));
      const returnType = checker.typeToString(signature.getReturnType());
      const generics = signature.getTypeParameters();

      result.signature.documentation = documentation;
      result.signature.returnType = returnType;

      if (generics) {
        const types = generics.map(t => t.symbol.escapedName).join(', ');
        const n = `${name}<${types}>`;

        result.name = n;
      }

      const jsdoc = signature.getJsDocTags();
      result.signature.jsdoc = {
        params: []
      };

      // TODO: check for all jsdoc comments
      jsdoc.forEach(doc => {
        if (doc.name === 'param') {
          const [name, ...comment] = doc.text.split(' ');
          result.signature.jsdoc.params.push({ name, comment: comment.join(' ') });
        }
      });
    }

    results.classes.push(result);
  }

  if (ts.isInterfaceDeclaration(node)) {
    const name = node.name.getText() || '<anonymous interface>';
    const symbol = checker.getSymbolAtLocation(node.name);
    if (!symbol) {
      log(`reference symbol at ${name} (${node.getSourceFile().fileName}) couldn't be found.`);
      return;
    }

    const sourceFile = node.getSourceFile();
    const result = {
      path: sourceFile.fileName,
      name
    };

    results.interfaces.push(result);
  }

  if (ts.isTypeAliasDeclaration(node)) {
    const name = node.name.getText() || '<anonymous type>';
    const symbol = checker.getSymbolAtLocation(node.name);
    if (!symbol) {
      log(`reference symbol at ${name} (${node.getSourceFile().fileName}) couldn't be found.`);
      return;
    }

    const sourceFile = node.getSourceFile();
    const result = {
      path: sourceFile.fileName,
      name
    };

    results.types.push(result);
  }
}

/**
 * Finds the parent element
 * @param {ts.Node} node The node to check
 * @returns {[type: 'class' | 'interface' | 'type', name: string | undefined] | null} Tuple array of [type, name]
 * or `null` if the parent isn't found or is anonymous
 */
const findParent = (node, result) => {
  if (!node.parent) return null;

  const file = node.getSourceFile();

  //console.log(`[${file.fileName}] parent: ${ts.SyntaxKind[node.parent?.kind]}`);
  //console.log(`[${file.fileName}] node:   ${ts.SyntaxKind[node.kind]}`);

  if (ts.isClassDeclaration(node.parent)) console.log(`found class def: ${node.parent.name.escapedText}`);

  /*
  const parent = node.parent;
  if (ts.isClassDeclaration(parent)) {
    const name = node.name.escapedText || '<anonymous>';
    if (name === '<anonymous>') return null;

    return ['class', result.classes.find(klass => klass.name === name)];
  } else if (ts.isInterfaceDeclaration(parent)) {
    const name = node.name.escapedText || '<anonymous>';
    if (name === '<anonymous>') return null;

    return ['interface', result.interfaces.find(klass => klass.name === name)];
  } else if (ts.isTypeAliasDeclaration(parent)) {
    const name = node.name.escapedText || '<anonymous>';
    if (name === '<anonymous>') return null;

    return ['type', result.types.find(klass => klass.name === name)];
  } else {
    return null;
  }
  */
};

main();
