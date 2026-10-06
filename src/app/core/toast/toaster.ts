/**
 * `Toaster`: shows short notifications (toasts) and loads the toast library only when needed.
 *
 * How this file was built:
 *   1. `yarn ng g service core/toast/toaster` generated an empty `@Service()` class and its spec.
 *   2. `error()` and `success()` load `@ngxpert/hot-toast` with a dynamic `import()` on first use
 *      and forward to its root `HotToastService` (its global config is optional, so no provider
 *      is registered at start-up).
 *   3. Messages are escaped (hot-toast renders strings as HTML, and they often come from a
 *      server). Errors are announced as alerts (`role="alert"`, assertive), stay 6 s and can be
 *      dismissed with a button labelled by the translated `close` text.
 *
 * Why: toasts appear when something goes wrong, rarely on the first screen. hot-toast and its
 * `@ngneat/overview` dependency add about 42 kB to the initial bundle when imported eagerly (as
 * ng-matero does); behind `import()` they become a lazy chunk. Callers also depend on this small
 * API instead of the library. hot-toast's defaults (polite status, 4 s, English close label) are
 * too easy to miss for errors (WCAG 4.1.3, 2.2.1).
 */
import { inject, Injector, Service } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { HotToastService } from '@ngxpert/hot-toast';

/** How long an error toast stays, in milliseconds. */
export const ERROR_TOAST_DURATION = 6000;

@Service()
export class Toaster {
  readonly #injector = inject(Injector);
  readonly #translate = inject(TranslateService);
  #service?: Promise<HotToastService>;

  /** Shows an error message (plain text). */
  error(message: string): void {
    void this.#load().then(service =>
      service.error(escapeHtml(message), {
        role: 'alert',
        ariaLive: 'assertive',
        duration: ERROR_TOAST_DURATION,
        dismissible: true,
        closeLabel: this.#translate.instant('close'),
      })
    );
  }

  /** Shows a success message (plain text). */
  success(message: string): void {
    void this.#load().then(service => service.success(escapeHtml(message)));
  }

  #load(): Promise<HotToastService> {
    this.#service ??= import('@ngxpert/hot-toast').then(({ HotToastService }) =>
      this.#injector.get(HotToastService)
    );
    return this.#service;
  }
}

function escapeHtml(text: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => entities[char]);
}
