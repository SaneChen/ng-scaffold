/**
 * Typed, fail-safe access to the browser's `localStorage` (values are stored as JSON).
 *
 * How this file was built:
 *   1. `yarn ng g service core/storage/local-storage` generated an empty `@Service()` class and
 *      its spec.
 *   2. Resolved the storage through `inject(DOCUMENT).defaultView` instead of the `localStorage`
 *      global, so tests (and non-browser renderers) can supply their own document.
 *   3. Added `get<T>(key, fallback)`, `set(key, value)` and `remove(key)`; every access is wrapped
 *      in `try/catch`.
 *   4. Moved that implementation into the shared `WebStorage` base class when `SessionStorage`
 *      was added; this class only picks the `localStorage` area.
 *
 * Why: `localStorage` is not always usable — private browsing, blocked site data, sandboxed
 * iframes or a full quota make it throw. Persisted preferences are a convenience, so a storage
 * failure must never break the application: reads fall back to the given default and writes
 * report `false`. (ng-matero's `LocalStorageService` used the global directly, returned `{}` for
 * missing keys and typed values as `any`.)
 */
import { Service } from '@angular/core';
import { WebStorage } from './web-storage';

@Service()
export class LocalStorage extends WebStorage {
  constructor() {
    super('localStorage');
  }
}
