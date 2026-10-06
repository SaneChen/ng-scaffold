/**
 * Public API of `src/app/theme` (the application shell) — import it from other folders as `@theme`.
 *
 * How this file was built: written by hand (Angular CLI has no barrel generator); every theme
 * commit appends the exports of the components it adds.
 *
 * Why: routes and the app configuration depend on this single entry point, while files inside
 * `theme/` import their siblings with relative paths (see docs/ARCHITECTURE.md §1).
 */
export * from './widgets/branding/branding';
export * from './widgets/fullscreen-button/fullscreen-button';
export * from './widgets/github-button/github-button';
export * from './widgets/notification-button/notification-button';
export * from './widgets/translate-button/translate-button';
export * from './widgets/user-button/user-button';
export * from './header/header';
