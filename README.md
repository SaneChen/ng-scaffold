# NgScaffold

An Angular 22+ frontend scaffold built with Material components.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

<!-- [ng-scaffold] Step 1: document the repository workflow without replacing the CLI baseline. -->

## ng-matero reimplementation

The `ng-matero` branch reimplements the admin shell and demos using Angular 22 standalone
components, signals, Signal Forms and Material 22. English, Simplified Chinese and Traditional
Chinese labels are included. Fonts, icons, images and demo data are served locally; page rendering
does not require a CDN. The dashboard uses lazily loaded Chart.js rather than ApexCharts.

### Run this repository

Use Node `^22.22.3 || ^24.15.0 || >=26` and Yarn Classic 1.22:

```sh
yarn install --frozen-lockfile
yarn start
```

The mock account is `ng-scaffold` / `ng-scaffold`. Both environment configurations intentionally
enable the mock backend for demonstration. This is not production authentication: configure a
real API and disable `mockApi` before using this starter with real users or data. Never treat
client-side route guards or unsigned mock tokens as server-side authorization.

### Install only the starter

The npm package has **not been published**. Build and pack a local schematic from a checkout
with its complete Git history:

```sh
yarn schematics:package
(cd dist/schematics && yarn pack --filename /tmp/ng-scaffold.tgz)
```

In a fresh Angular CLI 22.2 browser application generated with SCSS and Yarn, before editing
its welcome template, run `yarn ng add /tmp/ng-scaffold.tgz`. The installer copies the shell,
auth/profile pages, dashboard and shared infrastructure, not the demo routes, their images,
Formly, grid, photoviewer or browser-test dependencies. See [schematic usage](schematics/README.md)
for options, multi-project installation and standalone page generators, and the
[ng-matero migration guide](docs/MIGRATION.md) for existing applications.

### Verify and inspect browser results

```sh
NG_CLI_ANALYTICS=false tools/verify.sh
yarn e2e
```

The repository uses `yarn e2e`, not the unconfigured `ng e2e` target in the original CLI instructions
above. It builds the production application under `/ng-scaffold/`, uses an **already installed
Google Chrome**, and tests desktop and Pixel 7 viewport emulation. No browser download is performed.
The quality gate also checks tooling, schematics, three cache-only real CLI installations,
lint/stylelint, unit tests and the default production build; a missing Yarn cache entry is an error.

Browser coverage is derived from lazy route sources. Default enabled axe rules run without
exclusions; external render-time requests and uncaught page errors fail the tests. The HTML report
is in `playwright-report/` and failure traces/screenshots in `test-results/`. Axe `incomplete`
findings are attached for manual review. Mobile emulation is not a physical-device test, and
automated checks do not prove full WCAG compliance or cover every possible interactive state.

### GitHub Pages

The CI workflow deploys pushes to `ng-matero` **only after the quality job succeeds**. In repository
Settings → Pages, select **GitHub Actions** as the build source, and allow `ng-matero` in the
`github-pages` environment's deployment rules. Pull requests validate but never deploy.
The deployment uses the Pages-provided base path (including custom domains), copies `index.html`
to `404.html` for Angular deep links, and creates `.nojekyll`. Unknown routes keep a genuine HTTP
404 status while Angular renders the appropriate page. Local tests exercise this behavior rather
than returning HTTP 200 for every path. Workflow configuration alone does not establish a live
deployment; inspect the actual Actions run and its environment URL after pushing.

For project conventions and current acceptance status, read [HANDOFF](docs/HANDOFF.md),
[CONVENTIONS](docs/CONVENTIONS.md), [ARCHITECTURE](docs/ARCHITECTURE.md) and [ROADMAP](docs/ROADMAP.md).
