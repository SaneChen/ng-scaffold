/**
 * AST-located insertion operations for the Angular CLI-generated application files.
 * How this file was built: written by hand; Angular CLI has no schematic utility generator.
 * Why: ng-add must preserve generated imports, provider calls and component fields.
 */
import ts from 'typescript';

function parse(source: string): ts.SourceFile {
  const result = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      experimentalDecorators: true,
    },
  });
  const errors = result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error);
  if (errors?.length)
    throw new Error(
      `Invalid TypeScript: ${ts.flattenDiagnosticMessageText(errors[0].messageText, ' ')}`
    );
  return ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
}

interface ImportBinding {
  local: string;
  imported: string;
  typeOnly: boolean;
}

function bindings(declaration: ts.ImportDeclaration): ImportBinding[] {
  const clause = declaration.importClause;
  if (!clause) return [];
  const result: ImportBinding[] = [];
  if (clause.name)
    result.push({ local: clause.name.text, imported: 'default', typeOnly: clause.isTypeOnly });
  const named = clause.namedBindings;
  if (named && ts.isNamespaceImport(named))
    result.push({ local: named.name.text, imported: '*', typeOnly: clause.isTypeOnly });
  else if (named && ts.isNamedImports(named))
    result.push(
      ...named.elements.map(element => ({
        local: element.name.text,
        imported: element.propertyName?.text ?? element.name.text,
        typeOnly: clause.isTypeOnly || element.isTypeOnly,
      }))
    );
  return result;
}

function insert(source: string, position: number, text: string): string {
  return source.slice(0, position) + text + source.slice(position);
}

function variable(source: ts.SourceFile, name: string): ts.VariableDeclaration {
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return declaration;
    }
  }
  throw new Error(`Expected a generated ${name} declaration`);
}

export function insertImports(target: string, additions: readonly string[]): string {
  const parsed = parse(target);
  const imports = parsed.statements.filter(ts.isImportDeclaration);
  const known = new Map<string, ImportBinding & { module: string }>();
  const effects = new Set<string>();
  for (const declaration of imports) {
    if (!ts.isStringLiteral(declaration.moduleSpecifier))
      throw new Error('Expected a literal import source');
    const imported = bindings(declaration);
    for (const binding of imported)
      known.set(binding.local, { ...binding, module: declaration.moduleSpecifier.text });
    if (!declaration.importClause || imported.some(binding => !binding.typeOnly))
      effects.add(declaration.moduleSpecifier.text);
  }
  const extra: string[] = [];
  for (const addition of additions) {
    const additionSource = parse(addition);
    const statements = additionSource.statements;
    if (statements.length !== 1 || !ts.isImportDeclaration(statements[0])) {
      throw new Error('Expected one import declaration per addition');
    }
    const declaration = statements[0];
    if (!ts.isStringLiteral(declaration.moduleSpecifier))
      throw new Error('Expected a literal import source');
    const module = declaration.moduleSpecifier.text;
    const imported = bindings(declaration);
    const locals = new Set<string>();
    for (const binding of imported) {
      if (locals.has(binding.local)) throw new Error(`Duplicate import binding: ${binding.local}`);
      locals.add(binding.local);
    }
    const remaining = imported.filter(binding => {
      const existing = known.get(binding.local);
      if (!existing) return true;
      if (
        existing.module !== module ||
        existing.imported !== binding.imported ||
        existing.typeOnly !== binding.typeOnly
      )
        throw new Error(`Conflicting import binding: ${binding.local}`);
      return false;
    });
    const clause = declaration.importClause;
    if (!clause) {
      if (!effects.has(module)) {
        extra.push(addition.trim());
        effects.add(module);
      }
      continue;
    }
    if (!remaining.length) continue;
    const names = new Set(remaining.map(binding => binding.local));
    const named = clause.namedBindings;
    const nextNamed =
      named && ts.isNamedImports(named)
        ? ts.factory.updateNamedImports(
            named,
            named.elements.filter(element => names.has(element.name.text))
          )
        : named && names.has(named.name.text)
          ? named
          : undefined;
    const updated = ts.factory.updateImportDeclaration(
      declaration,
      declaration.modifiers,
      ts.factory.updateImportClause(
        clause,
        clause.isTypeOnly,
        clause.name && names.has(clause.name.text) ? clause.name : undefined,
        nextNamed
      ),
      declaration.moduleSpecifier,
      declaration.attributes
    );
    for (const binding of remaining) known.set(binding.local, { ...binding, module });
    if (remaining.some(binding => !binding.typeOnly)) effects.add(module);
    extra.push(ts.createPrinter().printNode(ts.EmitHint.Unspecified, updated, additionSource));
  }
  if (!extra.length) return target;
  const lastImport = imports.at(-1);
  const position = lastImport?.end ?? 0;
  return insert(target, position, `${lastImport ? '\n' : ''}${extra.join('\n')}\n`);
}

export function insertProviders(target: string, additions: readonly string[]): string {
  const parsed = parse(target);
  const declaration = variable(parsed, 'appConfig');
  if (!declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
    throw new Error('Expected appConfig to be an object literal');
  }
  const property = declaration.initializer.properties.find(
    member => ts.isPropertyAssignment(member) && member.name.getText(parsed) === 'providers'
  );
  if (
    !property ||
    !ts.isPropertyAssignment(property) ||
    !ts.isArrayLiteralExpression(property.initializer)
  ) {
    throw new Error('Expected appConfig.providers to be an array literal');
  }
  const providers = property.initializer;
  const anchor = providers.elements.find(
    entry =>
      ts.isCallExpression(entry) &&
      entry.expression.getText(parsed) === 'provideBrowserGlobalErrorListeners'
  );
  if (!anchor) throw new Error('Expected the generated browser error listener provider');
  const printer = ts.createPrinter({ removeComments: true });
  const key = (entry: ts.Expression, file: ts.SourceFile) =>
    printer.printNode(ts.EmitHint.Expression, entry, file);
  const known = new Set(providers.elements.map(entry => key(entry, parsed)));
  const extra = additions.filter(addition => {
    const candidate = parse(`(${addition});`);
    if (
      candidate.statements.length !== 1 ||
      !ts.isExpressionStatement(candidate.statements[0]) ||
      !ts.isParenthesizedExpression(candidate.statements[0].expression)
    )
      throw new Error('Expected one provider expression');
    const expression = candidate.statements[0].expression.expression;
    if (
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.CommaToken
    )
      throw new Error('Expected one provider expression');
    const signature = key(expression, candidate);
    if (known.has(signature)) return false;
    known.add(signature);
    return true;
  });
  if (!extra.length) return target;
  const separator =
    providers.elements.indexOf(anchor) === providers.elements.length - 1 &&
    !providers.elements.hasTrailingComma
      ? ','
      : '';
  return insert(target, anchor.end, `,\n${extra.join(',\n')}${separator}`);
}

export function insertRoutes(target: string, entries: string): string {
  const candidate = parse(`const generatedRoutes = [${entries}];`);
  if (candidate.statements.length !== 1) throw new Error('Expected only route entries');
  const parsed = parse(target);
  const declaration = variable(parsed, 'routes');
  if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) {
    throw new Error('Expected routes to be an array literal');
  }
  if (declaration.initializer.elements.length) {
    throw new Error('Refusing to replace existing routes; use a fresh standalone application');
  }
  return insert(target, declaration.initializer.getStart(parsed) + 1, `\n${entries}\n`);
}

export function insertConstructor(target: string, constructor: string): string {
  const parsed = parse(target);
  const classes = parsed.statements.filter(ts.isClassDeclaration);
  if (classes.length !== 1) throw new Error('Expected a single root component class');
  const component = classes[0];
  if (component.members.some(ts.isConstructorDeclaration)) {
    throw new Error('Refusing to replace an existing root component constructor');
  }
  const candidates = parse(`class Generated { ${constructor} }`).statements;
  if (candidates.length !== 1) throw new Error('Expected only one constructor declaration');
  const candidate = candidates[0];
  if (
    !ts.isClassDeclaration(candidate) ||
    candidate.members.length !== 1 ||
    !ts.isConstructorDeclaration(candidate.members[0])
  ) {
    throw new Error('Expected a constructor declaration');
  }
  return insert(target, component.end - 1, `\n${constructor}\n`);
}
