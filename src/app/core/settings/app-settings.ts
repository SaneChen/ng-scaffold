/**
 * Shape and default values of the user-adjustable layout settings.
 *
 * How this file was built:
 *   1. `yarn ng g interface core/settings/app-settings` generated the empty `AppSettings`
 *      interface.
 *   2. Added the same keys as ng-matero's `AppSettings`, with literal union types instead of
 *      plain strings where the value set is closed.
 *   3. Added `defaultAppSettings`, the `APP_SETTINGS` token whose factory returns them, and
 *      `provideAppSettings()` to override individual defaults.
 *   4. Added `appSettingsChoices`, the allowed values of every closed union, which
 *      `SettingsStore` checks when it restores stored preferences.
 *
 * Why: defaults are injected instead of imported, so an application (or the `ng add ng-scaffold`
 * prompts) changes them with one provider — `provideAppSettings({ navPos: 'top' })` — without
 * editing core files. `SettingsStore` layers what the user stored in the browser on top of them.
 * Stored values come from outside the type system (older releases, hand-edited storage), so the
 * literal unions are also listed as runtime values that a restored entry must match.
 */
import type { Direction } from '@angular/cdk/bidi';
import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

/** `auto` follows the operating system (`prefers-color-scheme`). */
export type AppTheme = 'light' | 'dark' | 'auto';

export interface AppSettings {
  /** Main navigation: a side menu, or a horizontal menu below the header. */
  navPos: 'side' | 'top';
  /** Layout direction; mirrored on `<html dir>` and CDK `Directionality`. */
  dir: Direction;
  theme: AppTheme;
  showHeader: boolean;
  /** `above` places the header over the full width, above the side menu. */
  headerPos: 'fixed' | 'static' | 'above';
  /** Show the user avatar and name at the top of the side menu. */
  showUserPanel: boolean;
  sidenavOpened: boolean;
  /** Collapse the side menu to an icon rail. */
  sidenavCollapsed: boolean;
  /** `auto` (browser languages) or one of the language codes in `LANGUAGES`, e.g. `zh-CN`. */
  language: string;
}

export const defaultAppSettings: Readonly<AppSettings> = {
  navPos: 'side',
  dir: 'ltr',
  theme: 'auto',
  showHeader: true,
  headerPos: 'fixed',
  showUserPanel: true,
  sidenavOpened: true,
  sidenavCollapsed: false,
  language: 'auto',
};

/** For each setting with a closed set of values, the values it accepts. */
export type AppSettingsChoices = {
  readonly [K in keyof AppSettings]?: readonly AppSettings[K][];
};

/**
 * Allowed values of the settings whose type is a closed union. `SettingsStore` drops a stored value
 * that is not listed here, so the layout never receives e.g. `dir: 'sideways'`. Booleans are
 * checked by type, and `language` stays open: `resolveLanguage()` maps any code to a shipped one.
 */
export const appSettingsChoices: AppSettingsChoices = {
  navPos: ['side', 'top'],
  dir: ['ltr', 'rtl'],
  theme: ['light', 'dark', 'auto'],
  headerPos: ['fixed', 'static', 'above'],
};

/** The application's default settings, before the user's stored preferences are applied. */
export const APP_SETTINGS = new InjectionToken<Readonly<AppSettings>>('APP_SETTINGS', {
  providedIn: 'root',
  factory: () => defaultAppSettings,
});

/**
 * Overrides individual default settings, e.g. `provideAppSettings({ theme: 'dark' })` in
 * `app.config.ts`. Keys that are not given keep the values of `defaultAppSettings`.
 */
export function provideAppSettings(overrides: Partial<AppSettings>): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: APP_SETTINGS, useValue: { ...defaultAppSettings, ...overrides } },
  ]);
}
