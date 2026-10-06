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
 *
 * Why: `localStorage` is not always usable — private browsing, blocked site data, sandboxed
 * iframes or a full quota make it throw. Persisted preferences are a convenience, so a storage
 * failure must never break the application: reads fall back to the given default and writes
 * report `false`. (ng-matero's `LocalStorageService` used the global directly, returned `{}` for
 * missing keys and typed values as `any`.)
 */
import { DOCUMENT, inject, Service } from '@angular/core';

@Service()
export class LocalStorage {
  readonly #storage = resolveStorage(inject(DOCUMENT));

  /**
   * Returns the parsed value stored under `key`, or `fallback` when the key is missing, the value
   * is not valid JSON or storage is unavailable.
   */
  get<T>(key: string, fallback: T): T {
    try {
      const raw = this.#storage?.getItem(key) ?? null;
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /**
   * Stores `value` as JSON under `key`. A value without a JSON form (`undefined`, a function)
   * removes the key instead, so `get()` returns its fallback, as for a key that was never set.
   * Returns `false` when storage is unavailable or the write failed.
   */
  set(key: string, value: unknown): boolean {
    if (!this.#storage) {
      return false;
    }
    try {
      // Despite its declared `string` return type, `JSON.stringify(undefined)` returns
      // `undefined`, which `setItem` would store as the unreadable string "undefined".
      const json: string | undefined = JSON.stringify(value);
      if (json === undefined) {
        this.#storage.removeItem(key);
      } else {
        this.#storage.setItem(key, json);
      }
      return true;
    } catch {
      // QuotaExceededError, SecurityError, or a value JSON cannot serialise (e.g. a BigInt).
      return false;
    }
  }

  /** Removes `key`; does nothing when storage is unavailable. */
  remove(key: string): void {
    try {
      this.#storage?.removeItem(key);
    } catch {
      // Storage became unavailable after start-up: there is nothing left to remove.
    }
  }
}

/** Reading `window.localStorage` itself throws a SecurityError when site data is blocked. */
function resolveStorage(document: Document): Storage | null {
  try {
    return document.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}
