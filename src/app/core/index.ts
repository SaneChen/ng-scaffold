/**
 * Public API of `src/app/core` — import it from other folders as `@core`.
 *
 * How this file was built: written by hand (Angular CLI has no barrel generator); every core
 * commit appends the exports of the files it adds.
 *
 * Why: code outside `core/` (the app shell, `theme/`, `routes/`) depends on this single entry point,
 * while files inside `core/` import their siblings with relative paths so the barrel never imports
 * itself and the dependency graph stays acyclic (see docs/ARCHITECTURE.md §1).
 */
export * from './storage/web-storage';
export * from './storage/local-storage';
export * from './storage/session-storage';
export * from './settings/app-settings';
export * from './settings/settings-store';
export * from './settings/app-directionality';
export * from './i18n/languages';
export * from './i18n/language-store';
export * from './i18n/paginator-intl';
export * from './i18n/provide-i18n';
export * from './preloader/preloader';
export * from './title/page-title-strategy';
