/**
 * Typed, fail-safe access to a browser Web Storage area (values are stored as JSON); the base of
 * `LocalStorage` and `SessionStorage`.
 *
 * How this file was built:
 *   1. `yarn ng g class core/storage/web-storage` generated an empty class and its spec.
 *   2. Moved the implementation of `LocalStorage` here unchanged and made the storage area
 *      (`localStorage` or `sessionStorage`) a constructor argument of the abstract class.
 *
 * Why: the authentication token is kept in `sessionStorage` unless the user ticks "remember me";
 * both areas need the same JSON handling and the same tolerance of blocked or full storage.
 * Each subclass is an injectable singleton, so tests and consumers keep depending on a concrete,
 * replaceable class.
 */
import { DOCUMENT, inject } from '@angular/core';

export type WebStorageArea = 'localStorage' | 'sessionStorage';

export abstract class WebStorage {
  readonly #storage: Storage | null;

  protected constructor(area: WebStorageArea) {
    this.#storage = resolveStorage(inject(DOCUMENT), area);
  }

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
function resolveStorage(document: Document, area: WebStorageArea): Storage | null {
  try {
    return document.defaultView?.[area] ?? null;
  } catch {
    return null;
  }
}
