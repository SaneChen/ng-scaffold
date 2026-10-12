# ng-scaffold schematics

Standalone Angular 22 / Material 22 admin starter. Fonts, icons, translations and images are
self-hosted; the dashboard loads Chart.js lazily. Demo routes and demo-only dependencies are
not installed.

## Install

Use Node `^22.22.3 || ^24.15.0 || >=26` and Yarn Classic 1.22. Create a fresh browser-only
Angular CLI 22.2 application using the default 2025 file naming:

```sh
yarn ng new my-admin --style=scss --package-manager=yarn --ssr=false
cd my-admin
yarn ng add ng-scaffold
yarn ng serve
```

Install before editing the welcome template or root tests. Pure CLI formatting differences are
accepted, but modified content, existing routes, constructors, reserved aliases or lint setup
are rejected rather than overwritten. Commit your workspace before installation. SSR and old
2016 component filenames are not supported by this initial release.

Options: `--project`, `--nav=side|top`, `--theme=auto|light|dark`, `--dir=ltr|rtl`, and
`--language=auto|en-US|zh-CN|zh-TW`. Navigation, theme, direction and language are prompted
interactively. For multi-application workspaces, select `--project=my-admin`; aliases and public
assets belong to that project. `--skip-install` skips the final dependency task; Angular CLI
still installs this schematic package itself. Run `yarn install` afterward.

```sh
yarn ng add ng-scaffold --nav=top --theme=dark --dir=rtl --language=zh-TW
yarn ng lint my-admin
yarn lint:scss
yarn ng test my-admin --watch=false
yarn ng build my-admin
```

The schematic package is saved in `devDependencies`. Required runtime packages are added
directly to the application's `dependencies`; lint tooling goes to `devDependencies`.
Non-default settings are installed via `provideAppSettings()` and synchronized with the
pre-bootstrap index script. Persisted user preferences still take precedence.

## Generate

```sh
yarn ng generate ng-scaffold:module orders --project=my-admin
yarn ng generate ng-scaffold:page list --module=orders --project=my-admin
yarn ng generate ng-scaffold:page reports --project=my-admin
```

`module` means a lazy standalone route group, **not an NgModule**. Its empty menu group stays
hidden until a page is added. `page` wraps the official Angular component generator and adds a
lazy route, translated page header, menu entry and label in all three dictionaries. Names must
be lowercase kebab-case single path segments. The generated human-readable names are initial
labels: customize their translations for your domain. Duplicate routes/files/keys are refused.

## Updates

`ng-update.migrations` points to `migration.json`. This is the first release and there is no
previous ng-scaffold installation format to migrate, so the initial migration collection is
intentionally empty. Future releases must add versioned, idempotent migrations with regression
tests; do not re-run `ng-add` to update an already configured application.

## Build and validate the package

From the repository checkout (including its Git history):

```sh
yarn schematics:package
cd dist/schematics
yarn pack --filename /tmp/ng-scaffold.tgz
```

The builder compiles the rules and derives the starter from the live repository sources, strips
demo fences, filters the menu and excludes demo assets. No duplicate component templates are
maintained. Baseline guards use the original `ng new` Git commit. The package has its own
metadata; the repository root remains private.

`yarn schematics:integration` tests fresh and custom-sourceRoot DevKit workspaces.
`yarn schematics:golden` installs a unique local test tarball into real default, non-default and
multi-project applications, compares copied sources and runs lint/stylelint/test/build before
and after generation. It uses only the existing Yarn cache, ignores dependency install scripts,
and fails on cache misses rather than downloading. Failed fixtures remain in the logged temp
directory for inspection; successful fixtures are removed. These are not browser AXE checks.

Before publishing, select a release version in `schematics/package.json`, verify registry
ownership of the package name and run the quality gate. Build again after golden testing;
golden artifacts use a temporary prerelease version and must not be published.
