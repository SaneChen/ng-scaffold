/**
 * Install source-derived starter files into a fresh standalone Angular 22 application.
 * How this file was built: written with the installed DevKit Rule and JSONFile APIs; no custom
 * schematic generator is available. Generated application files use insertion utilities, with
 * the documented welcome-template/test exceptions validated against the original CLI baseline.
 * Why: project root/sourceRoot and non-default settings must not drift from the startup script.
 */
import { normalize, relative } from '@angular-devkit/core';
import { apply, Rule, SchematicsException, Tree, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { JSONFile } from '@schematics/angular/utility/json-file';
import { isObservable, lastValueFrom } from 'rxjs';
import ts from 'typescript';
import { format } from 'prettier';
import {
  insertConstructor,
  insertImports,
  insertProviders,
  insertRoutes,
} from '../utils/insertions';

export interface NgAddOptions {
  project?: string;
  nav?: 'side' | 'top';
  theme?: 'auto' | 'light' | 'dark';
  dir?: 'ltr' | 'rtl';
  language?: 'auto' | 'en-US' | 'zh-CN' | 'zh-TW';
  skipInstall?: boolean;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new SchematicsException('Expected a configuration object');
  return value as Record<string, unknown>;
}

function read(tree: Tree, path: string): string {
  const value = tree.read(path);
  if (!value) throw new SchematicsException(`Missing file: ${path}`);
  return value.toString('utf8');
}

function path(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[a-zA-Z0-9_./-]*$/.test(value) ||
    value.startsWith('/') ||
    value.split('/').includes('..')
  )
    throw new SchematicsException('Expected a safe workspace-relative path');
  return value.replace(/\/$/, '');
}

function parse(source: string): ts.SourceFile {
  return ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
}

function imports(source: string): string[] {
  return parse(source)
    .statements.filter(ts.isImportDeclaration)
    .map(entry => entry.getFullText());
}

function initializer(source: string, name: string): ts.Expression {
  for (const statement of parse(source).statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find(
      entry => ts.isIdentifier(entry.name) && entry.name.text === name
    );
    if (declaration?.initializer) return declaration.initializer;
  }
  throw new SchematicsException(`Missing source initializer: ${name}`);
}

export function ngAdd(options: NgAddOptions): Rule {
  return async (inputTree, context) => {
    const tree = inputTree.branch();
    const workspace = new JSONFile(tree, 'angular.json');
    const projects = object(workspace.get(['projects']));
    const applications = Object.keys(projects).filter(
      name => object(projects[name])['projectType'] === 'application'
    );
    const name = options.project ?? (applications.length === 1 ? applications[0] : undefined);
    if (!name || !applications.includes(name))
      throw new SchematicsException('Specify an application with --project');
    const project = object(projects[name]);
    const root = path(project['root']);
    const sourceRoot = path(project['sourceRoot'] ?? `${root ? root + '/' : ''}src`);
    if (!sourceRoot) throw new SchematicsException('sourceRoot must not be empty');
    const prefix = root ? root + '/' : '';
    const appRoot = `${sourceRoot}/app`;
    const loaded = apply(url('../starter'), [])(context);
    const assets = isObservable(loaded) ? await lastValueFrom(loaded) : loaded;
    const manifest: unknown = JSON.parse(read(assets, '/manifest.json'));
    const metadata = object(manifest);
    const originalApp = read(tree, `${appRoot}/app.ts`);
    const app = parse(originalApp).statements.find(ts.isClassDeclaration);
    const title = app?.members.find(
      member => ts.isPropertyDeclaration(member) && member.name.getText() === 'title'
    );
    const titleValue =
      title &&
      ts.isPropertyDeclaration(title) &&
      title.initializer &&
      ts.isCallExpression(title.initializer)
        ? title.initializer.arguments[0]
        : undefined;
    if (!titleValue || !ts.isStringLiteral(titleValue))
      throw new SchematicsException('Expected the CLI-generated title signal');
    const applicationName = titleValue.text;
    const canonical = (source: string, parser: string) => format(source, { parser });
    if (
      (await canonical(read(tree, `${appRoot}/app.html`), 'angular')) !==
      (await canonical(read(assets, '/baseline/app.html'), 'angular'))
    )
      throw new SchematicsException('Refusing to replace a modified welcome template');
    if (
      (await canonical(read(tree, `${appRoot}/app.spec.ts`), 'typescript')) !==
      (await canonical(
        read(assets, '/baseline/app.spec.ts').replaceAll('ng-scaffold', applicationName),
        'typescript'
      ))
    )
      throw new SchematicsException('Refusing to replace modified root component tests');
    const changes = new Map<string, string>();
    const binaryFiles = new Map<string, NonNullable<ReturnType<Tree['read']>>>();
    const settings = {
      navPos: options.nav ?? 'side',
      theme: options.theme ?? 'auto',
      dir: options.dir ?? 'ltr',
      language: options.language ?? 'auto',
    };
    const defaults = { navPos: 'side', theme: 'auto', dir: 'ltr', language: 'auto' };
    const overrides = Object.fromEntries(
      Object.entries(settings).filter(
        ([key, value]) => value !== defaults[key as keyof typeof defaults]
      )
    );
    const template = (file: string) => read(assets, `/files/src/${file}`);
    const configSource = template('app/app.config.ts');
    const config = initializer(configSource, 'appConfig');
    if (!ts.isObjectLiteralExpression(config))
      throw new SchematicsException('Invalid source appConfig');
    const property = config.properties.find(
      entry => ts.isPropertyAssignment(entry) && entry.name.getText() === 'providers'
    );
    if (
      !property ||
      !ts.isPropertyAssignment(property) ||
      !ts.isArrayLiteralExpression(property.initializer)
    )
      throw new SchematicsException('Invalid source providers');
    const providers = property.initializer.elements
      .filter(
        entry =>
          !(
            ts.isCallExpression(entry) &&
            ['provideBrowserGlobalErrorListeners', 'provideRouter'].includes(
              entry.expression.getText()
            )
          )
      )
      .map(entry => entry.getFullText().trim());
    let configTarget = insertImports(read(tree, `${appRoot}/app.config.ts`), imports(configSource));
    if (Object.keys(overrides).length) {
      configTarget = insertImports(configTarget, [
        "// [ng-scaffold] Step 6: defaults selected during installation.\nimport { provideAppSettings } from '@core';",
      ]);
      providers.push(
        `// [ng-scaffold] Step 6: override defaults without changing core.\nprovideAppSettings(${JSON.stringify(overrides)})`
      );
    }
    changes.set(`${appRoot}/app.config.ts`, insertProviders(configTarget, providers));
    const routesSource = template('app/app.routes.ts');
    const routes = initializer(routesSource, 'routes');
    if (!ts.isArrayLiteralExpression(routes))
      throw new SchematicsException('Invalid source routes');
    changes.set(
      `${appRoot}/app.routes.ts`,
      insertRoutes(
        insertImports(read(tree, `${appRoot}/app.routes.ts`), imports(routesSource)),
        routes.getText().slice(1, -1)
      )
    );
    const appSource = template('app/app.ts');
    const sourceClass = parse(appSource).statements.find(ts.isClassDeclaration);
    const constructor = sourceClass?.members.find(ts.isConstructorDeclaration);
    if (!constructor) throw new SchematicsException('Missing starter constructor');
    changes.set(
      `${appRoot}/app.ts`,
      insertConstructor(insertImports(originalApp, imports(appSource)), constructor.getFullText())
    );
    changes.set(`${appRoot}/app.html`, template('app/app.html'));
    changes.set(
      `${appRoot}/app.spec.ts`,
      template('app/app.spec.ts').replace(
        "toBe('ng-scaffold')",
        `toBe(${JSON.stringify(applicationName)})`
      )
    );
    let index = read(tree, `${sourceRoot}/index.html`);
    const indexSource = template('index.html').replace(
      "const defaults = { theme: 'auto', dir: 'ltr', language: 'auto' };",
      `const defaults = ${JSON.stringify({ theme: settings.theme, dir: settings.dir, language: settings.language })};`
    );
    const head = indexSource.slice(
      indexSource.indexOf('    <!--'),
      indexSource.indexOf('  </head>')
    );
    const body = indexSource.slice(
      indexSource.indexOf('    <app-root></app-root>') + '    <app-root></app-root>'.length,
      indexSource.indexOf('  </body>')
    );
    if (index.includes('globalLoader') || !index.includes('</head>') || !index.includes('</body>'))
      throw new SchematicsException('Refusing to modify an already configured index');
    index = index
      .replace('</head>', head + '</head>')
      .replace('</body>', body.trimStart() + '\n</body>');
    changes.set(`${sourceRoot}/index.html`, index);
    if (!Array.isArray(metadata['files']))
      throw new SchematicsException('Invalid starter manifest');
    for (const entry of metadata['files']) {
      const file = path(object(entry)['path']);
      const destination = file.startsWith('src/')
        ? `${sourceRoot}/${file.slice(4)}`
        : `${prefix}${file}`;
      if (
        changes.has(destination) ||
        file === 'src/main.ts' ||
        file === 'src/app/app.scss' ||
        file === 'public/favicon.ico'
      )
        continue;
      if (!/\.(ts|html|scss|css|json)$/.test(file) || file.startsWith('public/')) {
        if (tree.exists(destination))
          throw new SchematicsException(`Refusing to overwrite ${destination}`);
        const content = assets.read('/files/' + file);
        if (!content) throw new SchematicsException(`Missing asset: ${file}`);
        binaryFiles.set(destination, content);
        continue;
      }
      let content = read(assets, '/files/' + file);
      if (file === 'src/styles.scss' && tree.exists(destination)) {
        const original = read(tree, destination);
        if (/@use\s+[^;]*\bas\s+mat\b/.test(original))
          throw new SchematicsException('Refusing to reuse an existing mat Sass namespace');
        const bodyStart = content.indexOf('\nhtml {');
        if (bodyStart < 0) throw new SchematicsException('Missing starter Sass prelude');
        content =
          content.slice(0, bodyStart) +
          '\n' +
          original +
          '\n' +
          content
            .slice(bodyStart)
            .replace(
              '/* You can add global styles to this file, and also import other style files */',
              ''
            );
        changes.set(destination, content);
        continue;
      }
      if (tree.exists(destination))
        throw new SchematicsException(`Refusing to overwrite ${destination}`);
      if (file.endsWith('.ts')) {
        const sourceDirectory = file.slice(0, file.lastIndexOf('/'));
        const destinationDirectory = destination.slice(0, destination.lastIndexOf('/'));
        content = content.replace(
          /(['"])(\.\.[^'"]*\/public\/[^'"]+)\1/g,
          (match: string, quote: string, imported: string) => {
            const original = normalize('/' + sourceDirectory + '/' + imported);
            const remapped = normalize('/' + prefix + original.slice(1));
            return quote + relative(normalize('/' + destinationDirectory), remapped) + quote;
          }
        );
      }
      if (file === 'src/index.spec.ts' && Object.keys(overrides).length) {
        content = content.replace(
          'import { defaultAppSettings }',
          'import { defaultAppSettings as baseAppSettings }'
        );
        content += `\n// [ng-scaffold] Installation defaults checked by this copied test.\nconst defaultAppSettings = { ...baseAppSettings, ...${JSON.stringify(overrides)} };\n`;
      }
      changes.set(destination, content);
    }
    for (const [destination, content] of changes) {
      if (tree.exists(destination)) tree.overwrite(destination, content);
      else tree.create(destination, content);
    }
    for (const [destination, content] of binaryFiles) tree.create(destination, content);
    const packageJson = new JSONFile(tree, 'package.json');
    packageJson.modify(['packageManager'], 'yarn@1.22.22');
    if (!packageJson.get(['scripts', 'lint:scss']))
      packageJson.modify(['scripts', 'lint:scss'], `stylelint "${sourceRoot}/**/*.scss"`);
    for (const [field, versions] of [
      ['dependencies', metadata['dependencies']],
      ['devDependencies', metadata['developmentDependencies']],
    ] as const) {
      for (const [dependency, version] of Object.entries(object(versions))) {
        if (typeof version !== 'string')
          throw new SchematicsException('Invalid dependency version');
        if (!packageJson.get([field, dependency])) packageJson.modify([field, dependency], version);
      }
    }
    for (const filename of ['tsconfig.app.json', 'tsconfig.spec.json']) {
      const configPath = prefix + filename;
      const configFile = new JSONFile(tree, configPath);
      const sourcePath = relative(normalize('/' + root), normalize('/' + sourceRoot));
      const reservedAliases = [
        '@core',
        '@core/*',
        '@shared',
        '@shared/*',
        '@theme',
        '@theme/*',
        '@env/*',
      ];
      for (const alias of reservedAliases) {
        if (configFile.get(['compilerOptions', 'paths', alias]))
          throw new SchematicsException(
            `Refusing to replace reserved alias ${alias} in ${configPath}`
          );
      }
      for (const area of ['core', 'shared', 'theme']) {
        configFile.modify(
          ['compilerOptions', 'paths', '@' + area],
          ['./' + sourcePath + '/app/' + area]
        );
        configFile.modify(
          ['compilerOptions', 'paths', '@' + area + '/*'],
          ['./' + sourcePath + '/app/' + area + '/*']
        );
      }
      configFile.modify(
        ['compilerOptions', 'paths', '@env/*'],
        ['./' + sourcePath + '/environments/*']
      );
    }
    const targetKey = project['architect'] ? 'architect' : 'targets';
    const targetPath = ['projects', name, targetKey];
    const assetsPath = [...targetPath, 'build', 'options', 'assets'];
    const buildAssets: unknown = workspace.get(assetsPath) ?? [];
    if (!Array.isArray(buildAssets)) throw new SchematicsException('Expected build assets array');
    const publicDirectory = prefix + 'public';
    if (
      !buildAssets.some(
        entry =>
          typeof entry === 'object' &&
          entry !== null &&
          object(entry)['input'] === publicDirectory &&
          object(entry)['glob'] === '**/*' &&
          !object(entry)['ignore'] &&
          [undefined, '', '/'].includes(object(entry)['output'] as string | undefined)
      )
    )
      workspace.modify(assetsPath, [...buildAssets, { glob: '**/*', input: publicDirectory }]);
    const styles: unknown = workspace.get([...targetPath, 'build', 'options', 'styles']);
    if (!Array.isArray(styles)) throw new SchematicsException('Expected a generated styles array');
    if (!styles.includes(`${sourceRoot}/styles.scss`))
      workspace.modify(
        [...targetPath, 'build', 'options', 'styles'],
        [`${sourceRoot}/styles.scss`, ...styles]
      );
    workspace.modify([...targetPath, 'build', 'options', 'inlineStyleLanguage'], 'scss');
    const replacementsPath = [
      ...targetPath,
      'build',
      'configurations',
      'development',
      'fileReplacements',
    ];
    const replacements: unknown = workspace.get(replacementsPath) ?? [];
    if (!Array.isArray(replacements))
      throw new SchematicsException('Expected fileReplacements array');
    if (
      replacements.some(
        entry => object(entry)['replace'] === `${sourceRoot}/environments/environment.ts`
      )
    )
      throw new SchematicsException('Refusing to replace an existing environment replacement');
    workspace.modify(replacementsPath, [
      ...replacements,
      {
        replace: `${sourceRoot}/environments/environment.ts`,
        with: `${sourceRoot}/environments/environment.development.ts`,
      },
    ]);
    if (workspace.get([...targetPath, 'lint']))
      throw new SchematicsException('Refusing to replace an existing lint target');
    workspace.modify([...targetPath, 'lint'], {
      builder: '@angular-eslint/builder:lint',
      options: {
        lintFilePatterns: [`${sourceRoot}/**/*.ts`, `${sourceRoot}/**/*.html`],
        eslintConfig: prefix + 'eslint.config.js',
      },
    });
    workspace.modify(['cli', 'packageManager'], 'yarn');
    for (const filename of ['eslint.config.js', '.stylelintrc', '.prettierrc']) {
      const destination = prefix + filename;
      if (tree.exists(destination)) {
        if (filename !== '.prettierrc')
          throw new SchematicsException(`Refusing to replace an existing ${destination}`);
        continue;
      }
      let content = read(assets, '/' + filename);
      if (filename === 'eslint.config.js' && root)
        content = content.replace(
          'projectService: true',
          "project: ['./tsconfig.app.json', './tsconfig.spec.json']"
        );
      if (filename === 'eslint.config.js' && typeof project['prefix'] === 'string')
        content = content.replaceAll(
          "prefix: 'app'",
          `prefix: ${JSON.stringify(['app', project['prefix']])}`
        );
      if (filename === '.stylelintrc')
        content = content.replace(
          'src/styles.scss',
          `${relative(normalize('/' + root), normalize('/' + sourceRoot))}/styles.scss`
        );
      tree.create(destination, content);
    }
    if (tree.exists('.gitignore')) {
      const ignore = read(tree, '.gitignore');
      if (!ignore.split('\n').includes('!/yarn.lock'))
        tree.overwrite(
          '.gitignore',
          ignore + '\n# [ng-scaffold] Keep reproducible Yarn installations.\n!/yarn.lock\n'
        );
    }
    if (!options.skipInstall)
      context.addTask(new NodePackageInstallTask({ packageManager: 'yarn' }));
    return tree;
  };
}
