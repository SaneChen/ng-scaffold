/**
 * Typed, fail-safe access to the browser's `sessionStorage` (values are stored as JSON); kept for
 * the lifetime of the browser tab only.
 *
 * How this file was built:
 *   1. `yarn ng g service core/storage/session-storage` generated an empty `@Service()` class and
 *      its spec.
 *   2. Made it extend `WebStorage` with the `sessionStorage` area (same API as `LocalStorage`).
 *
 * Why: `TokenStore` keeps the sign-in of a user who did not tick "remember me" here, so it ends
 * with the tab instead of surviving on a shared computer.
 */
import { Service } from '@angular/core';
import { WebStorage } from './web-storage';

@Service()
export class SessionStorage extends WebStorage {
  constructor() {
    super('sessionStorage');
  }
}
