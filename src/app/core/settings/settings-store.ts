/**
 * Single source of truth for the layout settings (navigation, header, direction, theme, language).
 *
 * How this file was built:
 *   1. `yarn ng g service core/settings/settings-store` generated an empty `@Service()` class and
 *      its spec.
 *   2. Added the private writable `#options` signal, restored from `LocalStorage` and merged over
 *      the `APP_SETTINGS` defaults, plus the read-only `options` view and the `update()` /
 *      `reset()` intent methods. A stored entry is restored only when its key is known, its type
 *      matches the default and, for closed unions, its value is listed in `appSettingsChoices`.
 *   3. Added `prefersDark` (the `(prefers-color-scheme: dark)` media query as a signal) and the
 *      derived `themeColor`.
 *   4. Added two `effect()`s: one persists the settings that differ from the defaults, the other
 *      mirrors `dir` and the `theme-dark` / `theme-auto` classes onto `<html>`.
 *
 * Why: OnPush is the default in Angular v22, so every consumer (layout, header, customizer) reads
 * signals and refreshes on its own when a setting changes. Side effects on the document live next
 * to the state that drives them, instead of imperative `setTheme()` / `setDirection()` calls that
 * ng-matero's `SettingsService` needed from `App.ngOnInit`. The `auto` theme now follows the OS
 * while the app is open (CSS does the switching, see src/styles/_themes.scss).
 */
import { BreakpointObserver } from '@angular/cdk/layout';
import { computed, DOCUMENT, effect, inject, Service, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LocalStorage } from '../storage/local-storage';
import { APP_SETTINGS, AppSettings, appSettingsChoices } from './app-settings';

/**
 * `localStorage` key that holds the settings the user changed. The inline theme script of
 * src/index.html reads it before the application starts: keep both in sync.
 */
export const SETTINGS_STORAGE_KEY = 'ng-scaffold-settings';

const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

@Service()
export class SettingsStore {
  readonly #document = inject(DOCUMENT);
  readonly #storage = inject(LocalStorage);
  readonly #defaults = inject(APP_SETTINGS);

  readonly #options = signal<AppSettings>({ ...this.#defaults, ...this.#restore() });

  /** Current settings. Change them with `update()` or `reset()`. */
  readonly options = this.#options.asReadonly();

  /**
   * Whether the operating system prefers a dark color scheme; follows changes while the app runs.
   * `BreakpointObserver` emits the current match synchronously, hence `requireSync`.
   */
  readonly prefersDark = toSignal(
    inject(BreakpointObserver)
      .observe(PREFERS_DARK_QUERY)
      .pipe(map(state => state.matches)),
    { requireSync: true }
  );

  /** The color scheme in effect: `auto` resolved with `prefersDark` (for charts, canvases...). */
  readonly themeColor = computed<'light' | 'dark'>(() => {
    const { theme } = this.#options();
    if (theme === 'auto') {
      return this.prefersDark() ? 'dark' : 'light';
    }
    return theme;
  });

  constructor() {
    // Persist only what differs from the defaults: users who never touched a setting pick up
    // new defaults of a later release, and `reset()` leaves no stale entry behind.
    effect(() => {
      const changed = differences(this.#options(), this.#defaults);
      if (Object.keys(changed).length > 0) {
        this.#storage.set(SETTINGS_STORAGE_KEY, changed);
      } else {
        this.#storage.remove(SETTINGS_STORAGE_KEY);
      }
    });

    // Mirror the settings that global CSS and the browser read from the root element.
    effect(() => {
      const { dir, theme } = this.#options();
      const html = this.#document.documentElement;
      html.dir = dir;
      html.classList.toggle('theme-dark', theme === 'dark');
      html.classList.toggle('theme-auto', theme === 'auto');
    });
  }

  /** Applies a partial change, e.g. `update({ theme: 'dark' })`. */
  update(patch: Partial<AppSettings>): void {
    this.#options.update(options => ({ ...options, ...patch }));
  }

  /** Returns to the application defaults and forgets the stored preferences. */
  reset(): void {
    this.#options.set({ ...this.#defaults });
  }

  /**
   * Reads the stored preferences. Storage is outside the type system (an older release, a
   * hand-edited entry), so every entry is validated and invalid ones fall back to the defaults.
   */
  #restore(): Partial<AppSettings> {
    const stored = this.#storage.get<unknown>(SETTINGS_STORAGE_KEY, {});
    if (typeof stored !== 'object' || stored === null) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(stored).filter(([key, value]) => isValidSetting(key, value, this.#defaults))
    );
  }
}

/** A known key whose value has the type of its default and, for closed unions, an allowed value. */
function isValidSetting(key: string, value: unknown, defaults: Readonly<AppSettings>): boolean {
  if (!Object.hasOwn(defaults, key)) {
    return false;
  }
  const name = key as keyof AppSettings;
  const choices: readonly unknown[] | undefined = appSettingsChoices[name];
  return typeof value === typeof defaults[name] && (choices?.includes(value) ?? true);
}

function differences(options: AppSettings, defaults: Readonly<AppSettings>): Partial<AppSettings> {
  const base = new Map(Object.entries(defaults));
  return Object.fromEntries(
    Object.entries(options).filter(([key, value]) => value !== base.get(key))
  );
}
