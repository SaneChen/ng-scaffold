/**
 * Public API of `src/app/shared` (reusable UI without application state) — import it from other
 * folders as `@shared`.
 *
 * How this file was built: written by hand (Angular CLI has no barrel generator); every shared
 * commit appends the exports of what it adds.
 *
 * Why: pages depend on this single entry point, while files inside `shared/` import their
 * siblings with relative paths (see docs/ARCHITECTURE.md §1).
 */
export * from './breadcrumb/breadcrumb';
export * from './breadcrumb/menu-trail';
export * from './page-header/page-header';
export * from './error-code/error-code';
