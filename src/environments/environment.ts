/**
 * Production environment — the default build configuration (`ng build`).
 *
 * How this file was built:
 *   1. `yarn ng g environments` created this file and `environment.development.ts`, and added a
 *      `fileReplacements` entry to the `development` configuration in angular.json, so
 *      `ng serve` swaps in the development values.
 *   2. Added the runtime settings below; keep both files in sync.
 */
export const environment = {
  production: true,
  /** Prefix for relative API calls made by the HTTP interceptors (empty string = same origin). */
  baseUrl: '',
  /**
   * Answer auth, user and menu requests with the in-memory mock API (core/mock) so the scaffold
   * runs without a backend. Set to `false` once a real API is available.
   */
  mockApi: true,
};
