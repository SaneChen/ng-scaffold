/**
 * Unit tests for `SettingsStore`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/settings/settings-store` generated the "should be created" test.
 *   2. Added tests for restoring (including unknown keys, wrong types and values outside
 *      `appSettingsChoices`), updating, persisting and resetting the settings, for the
 *      `<html>` side effects and for the `auto` theme. `MediaMatcher` is replaced by a fake media
 *      query list (jsdom has no `matchMedia`); `TestBed.tick()` flushes the effects.
 */
import { MediaMatcher } from '@angular/cdk/layout';
import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { defaultAppSettings, provideAppSettings } from './app-settings';
import { SETTINGS_STORAGE_KEY, SettingsStore } from './settings-store';

/** Minimal `MediaQueryList` that lets a test flip `prefers-color-scheme`. */
class FakeMediaQueryList {
  readonly #listeners = new Set<(event: { matches: boolean }) => void>();

  constructor(
    public matches: boolean,
    readonly media = '(prefers-color-scheme: dark)'
  ) {}

  addListener(listener: (event: { matches: boolean }) => void): void {
    this.#listeners.add(listener);
  }

  removeListener(listener: (event: { matches: boolean }) => void): void {
    this.#listeners.delete(listener);
  }

  emit(matches: boolean): void {
    this.matches = matches;
    this.#listeners.forEach(listener => listener({ matches }));
  }
}

describe('SettingsStore', () => {
  let service: SettingsStore;
  let darkQuery: FakeMediaQueryList;

  function setup(providers: (Provider | EnvironmentProviders)[] = []) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MediaMatcher,
          useValue: { matchMedia: () => darkQuery as unknown as MediaQueryList },
        },
        ...providers,
      ],
    });
    service = TestBed.inject(SettingsStore);
    TestBed.tick();
  }

  beforeEach(() => {
    darkQuery = new FakeMediaQueryList(false);
  });

  afterEach(() => {
    localStorage.clear();
    const html = document.documentElement;
    html.removeAttribute('dir');
    html.classList.remove('theme-dark', 'theme-auto');
  });

  it('should be created', () => {
    setup();
    expect(service).toBeTruthy();
  });

  it('should start from the default settings when nothing is stored', () => {
    setup();
    expect(service.options()).toEqual(defaultAppSettings);
  });

  it('should restore stored settings over the provided defaults', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ dir: 'rtl' }));
    setup([provideAppSettings({ navPos: 'top' })]);

    expect(service.options()).toEqual({ ...defaultAppSettings, navPos: 'top', dir: 'rtl' });
  });

  it('should ignore stored keys that are unknown or have the wrong type', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ showHeader: 'yes', unknown: true, theme: 'dark' })
    );
    setup();

    expect(service.options()).toEqual({ ...defaultAppSettings, theme: 'dark' });
  });

  it('should fall back to the defaults for stored values outside the allowed choices', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ dir: 'sideways', theme: 'neon', navPos: 'bottom', headerPos: 'above' })
    );
    setup();

    expect(service.options()).toEqual({ ...defaultAppSettings, headerPos: 'above' });
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('should persist only the settings that differ from the defaults', () => {
    setup();
    service.update({ navPos: 'top', sidenavCollapsed: true });
    TestBed.tick();

    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({
      navPos: 'top',
      sidenavCollapsed: true,
    });
  });

  it('should reset to the defaults and forget the stored preferences', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: 'dark' }));
    setup();

    service.reset();
    TestBed.tick();

    expect(service.options()).toEqual(defaultAppSettings);
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('should mirror the direction and theme classes on <html>', () => {
    setup();
    const html = document.documentElement;
    expect(html.dir).toBe('ltr');
    expect(html.classList).toContain('theme-auto');

    service.update({ dir: 'rtl', theme: 'dark' });
    TestBed.tick();
    expect(html.dir).toBe('rtl');
    expect(html.classList).toContain('theme-dark');
    expect(html.classList).not.toContain('theme-auto');

    service.update({ theme: 'light' });
    TestBed.tick();
    expect(html.classList).not.toContain('theme-dark');
    expect(html.classList).not.toContain('theme-auto');
  });

  it('should resolve the auto theme with the system color scheme and follow its changes', async () => {
    setup();
    expect(service.prefersDark()).toBe(false);
    expect(service.themeColor()).toBe('light');

    darkQuery.emit(true);
    // BreakpointObserver debounces media query changes by one macrotask.
    await new Promise(resolve => setTimeout(resolve));

    expect(service.prefersDark()).toBe(true);
    expect(service.themeColor()).toBe('dark');
  });

  it('should ignore the system color scheme when a theme is chosen explicitly', () => {
    darkQuery = new FakeMediaQueryList(true);
    setup();

    service.update({ theme: 'light' });
    expect(service.themeColor()).toBe('light');
  });
});
