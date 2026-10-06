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
export * from './i18n/provide-i18n';
export * from './preloader/preloader';
export * from './title/page-title-strategy';
export * from './auth/auth-token';
export * from './auth/token-store';
export * from './auth/user';
export * from './auth/login-api';
export * from './auth/auth-store';
export * from './auth/auth-guard';
export * from './toast/toaster';
export * from './http/api-url';
export * from './http/api-interceptor';
export * from './http/base-url-interceptor';
export * from './http/error-interceptor';
export * from './http/logging-interceptor';
export * from './http/settings-interceptor';
export * from './http/token-interceptor';
export * from './http/interceptors';
export * from './mock/mock-backend';
export * from './mock/mock-api-interceptor';
export * from './menu/menu';
export * from './menu/menu-store';
export * from './permissions/permission-store';
export * from './permissions/can';
export * from './permissions/permission-guard';
export * from './startup/startup';
