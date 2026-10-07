# Architecture

Design reference for the ng-scaffold admin template. ng-matero (v22.0.0) is the functional and
visual reference; this document fixes _how_ each feature is built with Angular v22 and Angular
Material v22. Read it together with [`CONVENTIONS.md`](./CONVENTIONS.md).

## 1. Source tree

```
src/
  app/
    app.ts · app.html · app.scss · app.config.ts · app.routes.ts · app.spec.ts   (from ng new, extended)
    core/          singletons: settings, storage, i18n, auth, http, menu, permissions, startup, mock API
    shared/        reusable UI without app state: page-header, breadcrumb, error-code, pipes, utils
    theme/         application shell: layouts, header, sidebar, sidemenu, topmenu, customizer, widgets
    routes/        routed pages, one folder per feature, every page lazy loaded
  environments/    environment.ts (production) · environment.development.ts
  styles/          global Sass partials (reboot, helpers, grid, colors, plugins)
public/
  data/menu.json   navigation tree served as a static asset
  i18n/*.json      en-US · zh-CN · zh-TW translations
  images/          brand, avatars and demo media
```

Path aliases (root `tsconfig.json`): `@core/*`, `@shared/*`, `@theme/*`, `@env/*`. Each top-level
folder exposes a public barrel (`@core`, `@shared`, `@theme`) for **other** folders; files inside
a folder import their siblings with relative paths, which keeps the import graph acyclic.

### Starter vs demo

`ng add ng-scaffold` ships the **starter**: `core`, `shared`, `theme`, `routes/dashboard`,
`routes/sessions`, `routes/profile`, global styles and public assets. The remaining
`routes/*` folders are **demo** pages (Material showcases, forms, tables, …) used by the live
demo only. Demo registrations in shared files are fenced so the packaging script can drop them:

```ts
// <demo>
{ path: 'material', loadChildren: () => import('./routes/material/material.routes') },
// </demo>
```

## 2. State model

OnPush is the default change detection in v22, therefore **everything a template reads is a
signal**. Singletons that own state are named `*Store` and expose read-only signals plus intent
methods:

```ts
@Service()
export class SettingsStore {
  readonly #options = signal<AppSettings>(this.#restore());
  readonly options = this.#options.asReadonly();
  readonly themeColor = computed(() => /* resolves 'auto' with prefers-color-scheme */);
  update(patch: Partial<AppSettings>) { this.#options.update(o => ({ ...o, ...patch })); }
}
```

- RxJS stays at the edges (HTTP, router events, BreakpointObserver) and is converted with
  `toSignal`, `rxResource` or `httpResource`.
- Side effects on the document (`<html dir|lang|class>`, persistence) live in `effect()`s owned by
  the store that holds the state.

## 3. Core

| Area        | Building blocks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings    | `AppSettings` interface + `APP_SETTINGS` defaults token (`provideAppSettings(partial)` overrides them) + `appSettingsChoices` (allowed values of the closed unions); `SettingsStore` restores only valid stored entries, persists the settings that differ from the defaults and mirrors `dir` and the `theme-dark`/`theme-auto` class onto `<html>`; `AppDirectionality` replaces CDK `Directionality` (`valueSignal` is a `linkedSignal` of `dir`, `change` fires once per switch)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Storage     | `WebStorage` base class with `LocalStorage` and `SessionStorage` (JSON, `DOCUMENT`-based, safe when storage is unavailable); the token lives in sessionStorage unless "remember me" is ticked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Preloader   | `index.html` holds the loader markup, its critical styles (with a copy of the `theme-*` color-scheme rules of `_themes.scss`: Beasties cannot inline rules for classes that do not exist at build time) and an inline script that applies the stored theme class, `dir` and the resolved `lang` (matched like `resolveLanguage()`) before the first paint, so the loader text is shown in the user's language (a second inline script after the loader holds its translations) and keeps its ellipsis in place in RTL (`dir="auto"`). Without a stored choice it uses its `defaults` line (`auto` / `ltr` / `auto`); `src/index.spec.ts` checks it, the storage key, the language matching and the loader texts (`layout.starting`) against the application code, and `ng add` (phase G) is to rewrite that line together with `provideAppSettings()` for non-default answers. `Preloader.hideAfterFirstNavigation()`, called by `App`, waits until the first navigation has settled (guard redirects are followed) and then fades out and removes `#globalLoader` in `afterNextRender` |
| Page title  | `PageTitleStrategy` (`TitleStrategy`): `"<translated route title> · <app name>"`; the app name is the `title` signal that `ng new` put in `App`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| i18n        | `provideI18n()`: `@ngx-translate/core` + HTTP loader (`i18n/<code>.json` through `HttpBackend`, fallback `en-US`) + an app initializer that loads the current and the fallback language before the first render (`failOnError`: a file that cannot be loaded keeps the previous language, English on start-up); `LANGUAGES` + `resolveLanguage()` (`Intl.Locale` matching); `LanguageStore` resolves the `language` setting (`auto` → `navigator.languages`) and drives `TranslateService.use` and `<html lang>`; `PaginatorIntl` translates `MatPaginator` (provided by `AdminLayout`, outside the main bundle); `DateAdapter.setLocale` is added together with the date adapter                                                                                                                                                                                                                                                                                                                                                                                                       |
| Auth        | `AuthToken` (plain or JWT; payload decoded with native `atob`, no CommonJS helpers), `TokenStore` (signal + persistence + refresh scheduling), `AuthStore` (`user`, `isAuthenticated`, `login`, `logout`, `refresh`), `LoginApi` (HTTP endpoints), functional `authGuard` (`CanMatchFn` + `CanActivateChildFn`, redirects to `/auth/login?returnUrl=`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| HTTP        | functional interceptors, in order: `baseUrlInterceptor`, `settingsInterceptor` (Accept-Language), `tokenInterceptor` (Bearer header; waits for the refresh of an expired refreshable token; 401 → sign-out), `apiInterceptor` (unwraps `{ code, msg, data }` envelopes), `errorInterceptor` (toast via the lazily loaded `Toaster`, 403/404/500 pages for failed GETs), `loggingInterceptor` (development only) and, last, `mockApiInterceptor`; one rule (`isApiUrl()`) decides what is an API request                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Mock API    | `MockBackend` + `mockApiInterceptor` answer `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/user` (unsigned JWTs with expiry) and serve `/user/menu` from `data/menu.json`; enabled by `environment.mockApi` and placed last in the chain, where a server would be                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Menu        | `Menu`/`MenuItem` interfaces (same shape as ng-matero: `route`, `name`, `type: link \| sub \| extLink \| extTabLink`, `icon`, `label`, `badge`, `permissions`, `children`); `MenuStore` holds the tree and derives the permission-filtered tree and breadcrumbs with `computed`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Permissions | `PermissionStore` (roles → permissions, signals), `*appCan` structural directive (`only` / `except`, else template), `permissionGuard` for `canMatch`; replaces `ngx-permissions`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Startup     | the user (`AuthStore`), roles (`PermissionStore`, `ROLE_PERMISSIONS`) and menu (`MenuStore`) derive from the token signal and reload per sign-in session; `Startup.ready()` (at most 10 s) is awaited by `provideAppInitializer` and `permissionGuard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## 4. Theme (application shell)

- `AdminLayout`: `mat-sidenav-container` with side or top navigation, fixed/static/above header,
  collapsible rail (`over` mode without backdrop; widens on hover or keyboard focus), mobile drawer
  (`BreakpointObserver` → `toSignal`), RTL via `Directionality`, route-loading indicator
  (`MatProgressBar` bound to `Router.currentNavigation()`, shown after 200 ms; no
  `ngx-progressbar`), a skip link to `<main>`, and the translated `MatPaginatorIntl` for its pages.
- `AuthLayout` for login/signup.
- `Header`, `Sidebar`, `UserPanel`, `Sidemenu` (accordion with `aria-expanded`/`aria-controls`,
  `routerLinkActive` + `ariaCurrentWhenActive`), `Topmenu` (menus, not a tab bar),
  `Customizer` (live settings panel) and `SidebarNotice` (notices), both opened by `SideSheet`
  (a full-height `MatDialog` at the inline end).
- Widgets: `Branding` (`NgOptimizedImage`), `NotificationButton`, `TranslateButton`,
  `UserButton`, `FullscreenButton` (native Fullscreen API, no `screenfull`), `GithubButton`
  (demo only).

## 5. Pages

| Route                                                                                              | Starter | Notes                                                                       |
| -------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `/dashboard`                                                                                       | yes     | statistics cards, charts loaded on demand (Chart.js via dynamic `import()`) |
| `/auth/login`, `/auth/signup`                                                                      | yes     | Signal Forms, `autocomplete`, translated validation messages                |
| `/403`, `/404`, `/500`                                                                             | yes     | `ErrorCode` component                                                       |
| `/profile/overview`, `/profile/settings`                                                           | yes     | fixes ng-matero's user menu links to unshipped pages                        |
| `/design`, `/material`, `/forms`, `/tables`, `/media`, `/permissions`, `/utilities`, `/menu-level` | demo    | same menu tree as ng-matero                                                 |

## 6. Styling

- Material M3 via `mat.theme()` (written by `ng add @angular/material`). Dark mode switches the
  `color-scheme` of `<body>` (`.theme-dark` → `dark`, `.theme-auto` → `light dark`), so every
  `light-dark()` system token follows automatically. `src/index.html` repeats these two rules as
  critical CSS, so the chosen scheme applies before the deferred stylesheet arrives.
- Fonts are self-hosted (`src/styles/_fonts.scss`): Roboto 300/400/500 and Material Symbols
  Outlined come from `@fontsource/*` packages, so neither the build (font inlining) nor visitors
  depend on fonts.googleapis.com.
- Components style themselves with `--mat-sys-*` tokens and `mat.*-overrides()` mixins; no
  internal `.mat-mdc-*` selectors, no `::ng-deep`, no `ViewEncapsulation.None`.
- Global partials in `src/styles/`: `_reboot` (minimal resets Material does not cover),
  `helpers` (spacing/display/flex/text utilities used by the css-helpers demo), `grid` (CSS grid
  utilities used by the css-grid demo), `colors` (palette utilities used by menu labels and the
  colors demo), `plugins` (third-party skins). Generated selectors are kept small enough for the
  default `anyComponentStyle`/`initial` budgets.

## 7. Third-party libraries

| Purpose                                                                               | Library                                                       | Reason                                         |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| Translations                                                                          | `@ngx-translate/core`, `@ngx-translate/http-loader`           | runtime language switching (same as ng-matero) |
| Extra Material components (grid, select, datetimepicker, colorpicker, photoviewer, …) | `@ng-matero/extensions` (+ date-fns adapter)                  | ng-matero feature parity                       |
| Dynamic forms demo                                                                    | `@ngx-formly/core`, `@ngx-formly/material`                    | ng-matero feature parity (demo only)           |
| Toasts                                                                                | `@ngxpert/hot-toast`                                          | same notifications as ng-matero                |
| Fonts                                                                                 | `@fontsource/roboto`, `@fontsource/material-symbols-outlined` | self-hosted, offline builds                    |
| Dates                                                                                 | `date-fns`, `@angular/material-date-fns-adapter`              | date adapters                                  |
| Charts                                                                                | `chart.js`                                                    | dashboard charts, loaded lazily; MIT           |

Dropped compared with ng-matero: `apexcharts` (5+ is dual licensed — free only below US$2M
revenue and not for redistribution in toolkits — which a scaffold installed with `ng add` cannot
impose on its users; replaced by Chart.js), `ngx-permissions` (own signal implementation),
`ngx-progressbar` (`MatProgressBar`), `screenfull` (native API), `base64-js` (native `atob`),
`angular-in-memory-web-api` (functional mock interceptor), `photoviewer` direct dependency
(provided through `@ng-matero/extensions`).

## 8. `ng add ng-scaffold`

- Package `ng-scaffold` (schematics only) with `"ng-add": { "save": "devDependencies" }` and
  declared runtime dependencies.
- The packaging script copies the starter files straight from this repository (no hand-written
  templates) and strips `<demo>` fences.
- The schematic edits files generated by `ng new` **by insertion only** (imports, providers,
  routes, JSON keys) and relies on Angular CLI's automatic Prettier pass for formatting.
- Paths come from the target project (`root`, `sourceRoot`), aliases are written per project, so
  `--project` works in multi-project workspaces.
- CI "golden" test: `ng new ng-scaffold` → `ng add <local tarball>` → the result must equal this
  repository's starter files → `ng lint`, `ng test`, `ng build` must pass.
