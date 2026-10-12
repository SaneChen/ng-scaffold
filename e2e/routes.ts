/**
 * Derive browser scan URLs from the real lazy route files instead of a drifting manual list.
 * How this file was built: TypeScript AST traversal; no route-inventory generator exists.
 * Why: new demo pages must automatically enter browser accessibility coverage.
 */
import ts from 'typescript';

export function routePaths(
  read: (file: string) => string,
  initial = 'src/app/app.routes.ts'
): string[] {
  const paths = new Set<string>();
  function visit(file: string, parent: string, ancestors: string[]): void {
    if (ancestors.includes(file)) throw new Error('Circular lazy route file');
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    const declarations = source.statements
      .filter(ts.isVariableStatement)
      .flatMap(statement => [...statement.declarationList.declarations]);
    const unwrap = (expression: ts.Expression): ts.Expression =>
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isSatisfiesExpression(expression)
        ? unwrap(expression.expression)
        : expression;
    const exported = source.statements.find(ts.isExportAssignment)?.expression;
    const declared = declarations.find(
      declaration => declaration.name.getText(source) === 'routes'
    )?.initializer;
    const routes = declared ? unwrap(declared) : exported ? unwrap(exported) : undefined;
    if (!routes || !ts.isArrayLiteralExpression(routes))
      throw new Error(`Unsupported route array: ${file}`);
    const value = (expression: ts.Expression, scope: Record<string, string>): string => {
      if (ts.isStringLiteral(expression)) return expression.text;
      if (ts.isIdentifier(expression) && Object.hasOwn(scope, expression.text))
        return scope[expression.text];
      if (
        ts.isBinaryExpression(expression) &&
        expression.operatorToken.kind === ts.SyntaxKind.PlusToken
      )
        return value(expression.left, scope) + value(expression.right, scope);
      throw new Error('Expected statically enumerable route path');
    };
    function children(
      array: ts.ArrayLiteralExpression,
      prefix: string,
      scope: Record<string, string> = {}
    ): void {
      function entryRoute(
        entry: ts.ObjectLiteralExpression,
        bindings: Record<string, string>
      ): void {
        const properties = entry.properties.filter(ts.isPropertyAssignment);
        const property = (name: string) =>
          properties.find(item => item.name.getText(source) === name)?.initializer;
        const segment = property('path');
        if (!segment) throw new Error('Expected static route path');
        const segmentValue = value(segment, bindings);
        if (segmentValue === '**' || property('redirectTo')) return;
        const path = [prefix, segmentValue].filter(Boolean).join('/');
        if (!property('children') && (property('loadComponent') || property('component')))
          paths.add(path);
        let nested = property('children');
        if (nested && ts.isIdentifier(nested))
          nested = declarations.find(
            declaration => declaration.name.getText(source) === nested?.getText(source)
          )?.initializer;
        if (property('children') && (!nested || !ts.isArrayLiteralExpression(nested)))
          throw new Error(`Unsupported route children: ${file}`);
        if (nested && ts.isArrayLiteralExpression(nested)) children(nested, path, bindings);
        const lazy = property('loadChildren');
        if (lazy) {
          let imported: string | undefined;
          const findImport = (node: ts.Node): void => {
            if (
              ts.isCallExpression(node) &&
              node.expression.kind === ts.SyntaxKind.ImportKeyword &&
              node.arguments[0] &&
              ts.isStringLiteral(node.arguments[0])
            )
              imported = node.arguments[0].text;
            ts.forEachChild(node, findImport);
          };
          findImport(lazy);
          if (!imported?.startsWith('.')) throw new Error(`Unsupported lazy routes: ${file}`);
          const pieces = [...file.split('/').slice(0, -1), ...imported.split('/')];
          const normalized: string[] = [];
          for (const piece of pieces) {
            if (piece === '..') normalized.pop();
            else if (piece !== '.') normalized.push(piece);
          }
          visit(normalized.join('/') + '.ts', path, [...ancestors, file]);
        }
      }
      for (const element of array.elements) {
        if (ts.isObjectLiteralExpression(element)) entryRoute(element, scope);
        else if (
          ts.isSpreadElement(element) &&
          ts.isCallExpression(element.expression) &&
          ts.isPropertyAccessExpression(element.expression.expression) &&
          element.expression.expression.name.text === 'map' &&
          ts.isArrayLiteralExpression(element.expression.expression.expression)
        ) {
          const mapper = element.expression.arguments[0];
          if (
            !mapper ||
            !ts.isArrowFunction(mapper) ||
            !mapper.parameters[0] ||
            !ts.isIdentifier(mapper.parameters[0].name)
          )
            throw new Error('Unsupported route map');
          const body = ts.isBlock(mapper.body) ? undefined : unwrap(mapper.body);
          if (!body || !ts.isObjectLiteralExpression(body))
            throw new Error('Unsupported mapped route');
          for (const item of element.expression.expression.expression.elements)
            entryRoute(body, { ...scope, [mapper.parameters[0].name.text]: value(item, scope) });
        } else throw new Error('Unsupported route expression');
      }
    }
    children(routes, parent);
  }
  visit(initial, '', []);
  return [...paths].filter(Boolean).sort();
}
