/**
 * `scheduleAt(time, callback)`: runs `callback` at an absolute time (ms since the epoch).
 *
 * How this file was built: written by hand (a plain function; Angular CLI has no generator for
 * it) for the token expiry of `TokenStore` and the token refresh of `AuthStore`.
 *
 * Why: `setTimeout` silently fires at once for delays above 2^31 - 1 ms (about 24.8 days), which
 * a long-lived token easily exceeds. Longer waits are split into steps.
 */

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** Schedules `callback` for `time` (or now if it has passed); returns a function that cancels. */
export function scheduleAt(time: number, callback: () => void): () => void {
  let handle: ReturnType<typeof setTimeout>;
  const wait = () => {
    const delay = Math.max(0, time - Date.now());
    handle = setTimeout(delay > MAX_TIMEOUT_MS ? wait : callback, Math.min(delay, MAX_TIMEOUT_MS));
  };
  wait();
  return () => clearTimeout(handle);
}
