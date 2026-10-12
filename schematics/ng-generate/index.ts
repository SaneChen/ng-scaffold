/**
 * Generate lazy standalone route groups and pages, never Angular NgModules.
 * How this file was built: DevKit rules wrap the official component schematic, then insert
 * routes and menu/translation metadata into the selected installed starter.
 * Why: generated pages must share the starter's authenticated layout and lazy boundaries.
 */
import { strings } from '@angular-devkit/core';
import {
  chain,
  externalSchematic,
  Rule,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { JSONFile } from '@schematics/angular/utility/json-file';
import ts from 'typescript';
import { insertImports } from '../utils/insertions';

interface GenerateOptions {
  name: string;
  project?: string;
  module?: string;
}

function read(tree: Tree, file: string): string {
  const content = tree.read(file);
  if (!content) throw new SchematicsException(`Missing starter file: ${file}`);
  return content.toString('utf8');
}

function segment(value: string): string {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value))
    throw new SchematicsException('Names must be lowercase kebab-case path segments');
  return value;
}

function selected(tree: Tree, options: GenerateOptions) {
  const projects = new JSONFile(tree, 'angular.json').get(['projects']);
  if (!projects || typeof projects !== 'object' || Array.isArray(projects))
    throw new SchematicsException('Missing workspace projects');
  const entries = Object.entries(projects).filter(
    ([, value]) => value?.['projectType'] === 'application'
  );
  const name = options.project ?? (entries.length === 1 ? entries[0][0] : undefined);
  const project = entries.find(([key]) => key === name)?.[1];
  if (
    !project ||
    typeof project !== 'object' ||
    typeof project['sourceRoot'] !== 'string' ||
    typeof project['root'] !== 'string'
  )
    throw new SchematicsException('Select an application with --project');
  const source = project['sourceRoot'];
  const root = project['root'];
  if ([source, root].some(value => value.startsWith('/') || value.split('/').includes('..')))
    throw new SchematicsException('Unsafe workspace path');
  read(tree, `${source}/app/core/index.ts`);
  return { name, source, publicRoot: root ? root + '/public' : 'public' };
}

function routeArray(source: ts.SourceFile, admin: boolean): ts.ArrayLiteralExpression {
  const arrays: ts.ArrayLiteralExpression[] = [];
  function visit(node: ts.Node): void {
    if (ts.isArrayLiteralExpression(node)) {
      if (
        !admin &&
        ts.isVariableDeclaration(node.parent) &&
        node.parent.name.getText(source) === 'routes'
      )
        arrays.push(node);
      if (
        admin &&
        ts.isPropertyAssignment(node.parent) &&
        node.parent.name.getText(source) === 'children' &&
        node.parent.parent.getText(source).includes('m.AdminLayout')
      )
        arrays.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (arrays.length !== 1) throw new SchematicsException('Expected one starter routes array');
  return arrays[0];
}

function insertRoute(
  tree: Tree,
  file: string,
  routeName: string,
  fragment: string,
  admin: boolean
): void {
  const content = read(tree, file);
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const routes = routeArray(source, admin);
  const routePath = (entry: ts.Expression) =>
    ts.isObjectLiteralExpression(entry)
      ? entry.properties.find(
          property => ts.isPropertyAssignment(property) && property.name.getText(source) === 'path'
        )
      : undefined;
  for (const entry of routes.elements) {
    const property = routePath(entry);
    if (
      property &&
      ts.isPropertyAssignment(property) &&
      ts.isStringLiteral(property.initializer) &&
      property.initializer.text === routeName
    )
      throw new SchematicsException(`Route already exists: ${routeName}`);
  }
  const wildcard = routes.elements.find(entry => {
    const property = routePath(entry);
    return (
      property &&
      ts.isPropertyAssignment(property) &&
      ts.isStringLiteral(property.initializer) &&
      property.initializer.text === '**'
    );
  });
  const offset = wildcard ? wildcard.getFullStart() : routes.getEnd() - 1;
  const comma = !wildcard && routes.elements.length && !routes.elements.hasTrailingComma ? ',' : '';
  tree.overwrite(
    file,
    content.slice(0, offset) +
      comma +
      '\n// [ng-scaffold] Generated lazy route.\n' +
      fragment +
      ',\n' +
      content.slice(offset)
  );
}

function addMenu(tree: Tree, publicRoot: string, name: string, module?: string): void {
  const file = `${publicRoot}/data/menu.json`;
  const config = new JSONFile(tree, file);
  const menu = config.get(['menu']);
  if (!Array.isArray(menu)) throw new SchematicsException('Expected starter menu');
  const entry = { route: name, name, type: 'link', icon: 'article' };
  if (module) {
    const index = menu.findIndex(item => item?.['name'] === module && item?.['type'] === 'sub');
    if (index < 0) throw new SchematicsException(`Missing generated module menu: ${module}`);
    const children = menu[index]['children'];
    if (!Array.isArray(children) || children.some(item => item?.['name'] === name))
      throw new SchematicsException('Invalid or duplicate page menu');
    config.modify(['menu', index, 'children'], [...children, entry]);
  } else {
    if (menu.some(item => item?.['name'] === name))
      throw new SchematicsException(`Menu already exists: ${name}`);
    config.modify(['menu'], [...menu, entry]);
  }
  for (const language of ['en-US', 'zh-CN', 'zh-TW']) {
    const dictionary = new JSONFile(tree, `${publicRoot}/i18n/${language}.json`);
    const key = ['menu', module ? module + '.' + name : name];
    if (dictionary.get(key) !== undefined)
      throw new SchematicsException(`Translation already exists: ${key.join('.')}`);
    dictionary.modify(key, strings.classify(name));
  }
}

export function generateModule(options: GenerateOptions): Rule {
  return inputTree => {
    const tree = inputTree.branch();
    const project = selected(tree, options);
    const name = segment(options.name);
    const file = `${project.source}/app/routes/${name}/${name}.routes.ts`;
    if (tree.exists(file)) throw new SchematicsException(`Module already exists: ${name}`);
    tree.create(
      file,
      `/** Lazy route group generated by ng-scaffold:module; no NgModule. */\nimport { Routes } from '@angular/router';\nconst routes: Routes = [];\nexport default routes;\n`
    );
    insertRoute(
      tree,
      `${project.source}/app/app.routes.ts`,
      name,
      `{ path: '${name}', loadChildren: () => import('./routes/${name}/${name}.routes') }`,
      true
    );
    const menu = new JSONFile(tree, `${project.publicRoot}/data/menu.json`);
    const entries = menu.get(['menu']);
    if (!Array.isArray(entries) || entries.some(entry => entry?.['name'] === name))
      throw new SchematicsException('Duplicate or invalid menu');
    menu.modify(
      ['menu'],
      [...entries, { route: name, name, type: 'sub', icon: 'folder', children: [] }]
    );
    for (const language of ['en-US', 'zh-CN', 'zh-TW']) {
      const dictionary = new JSONFile(tree, `${project.publicRoot}/i18n/${language}.json`);
      if (dictionary.get(['menu', name]) !== undefined)
        throw new SchematicsException('Duplicate module translation');
      dictionary.modify(['menu', name], strings.classify(name));
    }
    return tree;
  };
}

export function generatePage(options: GenerateOptions): Rule {
  return (inputTree, context) => {
    const tree = inputTree.branch();
    const project = selected(tree, options);
    const name = segment(options.name);
    const module = options.module ? segment(options.module) : undefined;
    const directory = `${project.source}/app/routes/${module ? module + '/' : ''}${name}`;
    const routeFile = module
      ? `${project.source}/app/routes/${module}/${module}.routes.ts`
      : `${project.source}/app/app.routes.ts`;
    if (tree.exists(`${directory}/${name}.ts`))
      throw new SchematicsException(`Page already exists: ${name}`);
    const key = `menu.${module ? module + '.' : ''}${name}`;
    return chain([
      externalSchematic('@schematics/angular', 'component', {
        name,
        project: project.name,
        path: directory,
        flat: true,
        inlineTemplate: true,
        inlineStyle: true,
        skipImport: true,
        skipTests: false,
        style: 'scss',
        type: '',
      }),
      (generated: Tree) => {
        const file = `${directory}/${name}.ts`;
        const source = read(generated, file);
        const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
        const component = parsed.statements.find(ts.isClassDeclaration)?.name?.text;
        if (!component) throw new SchematicsException('Missing generated component class');
        const rewritten = source
          .replace('imports: []', 'imports: [PageHeader]')
          .replace(/template: `[^`]*`/, `template: \`<app-page-header heading="${key}" />\``);
        generated.overwrite(
          file,
          `/** Generated by the Angular component schematic and extended with a translated page header. */\nimport { PageHeader } from '@shared';\n` +
            rewritten
        );
        const specFile = `${directory}/${name}.spec.ts`;
        const spec = insertImports(read(generated, specFile), [
          "import { provideRouter } from '@angular/router';",
          "import { provideTranslateService } from '@ngx-translate/core';",
          "import { MenuStore } from '@core';",
        ]).replace(
          new RegExp(`imports:\\s*\\[\\s*${component}\\s*\\],?`),
          `imports: [${component}],\n// [ng-scaffold] Isolate the page header from authenticated HTTP state.\nproviders: [provideRouter([]), provideTranslateService(), { provide: MenuStore, useValue: { trail: () => [] } }],`
        );
        if (!spec.includes('providers: [provideRouter([])'))
          throw new SchematicsException('Expected generated test imports to configure providers');
        generated.overwrite(specFile, spec);
        insertRoute(
          generated,
          routeFile,
          name,
          `{ path: '${name}', title: '${key}', loadComponent: () => import('./${module ? '' : 'routes/'}${name}/${name}').then(component => component.${component}) }`,
          !module
        );
        addMenu(generated, project.publicRoot, name, module);
        return generated;
      },
    ])(tree, context);
  };
}
