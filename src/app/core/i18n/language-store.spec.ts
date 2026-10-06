/**
 * Unit tests for `LanguageStore`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/i18n/language-store` generated the "should be created" test.
 *   2. Added tests for resolving `auto`, loading the chosen language, following the setting and
 *      the browser languages, a file that fails to load, and `<html lang>`. A synchronous fake
 *      loader replaces the HTTP loader and `navigator.languages` is stubbed.
 */
import { TestBed } from '@angular/core/testing';
import {
  provideTranslateLoader,
  provideTranslateService,
  TranslateLoader,
  TranslateService,
  TranslationObject,
} from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { SettingsStore } from '../settings/settings-store';
import { LanguageStore } from './language-store';

/**
 * Answers every language at once (or fails the ones listed in `failing`, like a 404 under
 * `failOnError`) and records which ones were requested.
 */
class FakeLoader extends TranslateLoader {
  readonly requested: string[] = [];
  readonly failing = new Set<string>();

  getTranslation(lang: string): Observable<TranslationObject> {
    this.requested.push(lang);
    if (this.failing.has(lang)) {
      return throwError(() => new Error(`i18n/${lang}.json: 404 Not Found`));
    }
    return of({ greeting: `hello ${lang}` });
  }
}

describe('LanguageStore', () => {
  let service: LanguageStore;
  let loader: FakeLoader;
  let browserLanguages: string[];

  beforeEach(() => {
    browserLanguages = ['zh-HK', 'en'];
    vi.spyOn(navigator, 'languages', 'get').mockImplementation(() => browserLanguages);
    loader = new FakeLoader();
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ loader: provideTranslateLoader(() => loader) })],
    });
    service = TestBed.inject(LanguageStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should resolve the auto setting from the browser languages', () => {
    expect(service.current()).toBe('zh-TW');
  });

  it('should load the current language and set <html lang>', async () => {
    await service.load();

    const translate = TestBed.inject(TranslateService);
    expect(translate.getCurrentLang()).toBe('zh-TW');
    expect(translate.instant('greeting')).toBe('hello zh-TW');
    expect(document.documentElement.lang).toBe('zh-TW');
  });

  it('should switch language when the setting changes, loading each language once', async () => {
    await service.load();

    TestBed.inject(SettingsStore).update({ language: 'zh-CN' });
    TestBed.tick();
    await service.load();

    expect(TestBed.inject(TranslateService).getCurrentLang()).toBe('zh-CN');
    expect(document.documentElement.lang).toBe('zh-CN');
    // No fallback language is configured in this test, so only the chosen languages are loaded.
    expect(loader.requested).toEqual(['zh-TW', 'zh-CN']);
  });

  it('should keep the previous language when a file fails to load, and retry later', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const translate = TestBed.inject(TranslateService);
    const settings = TestBed.inject(SettingsStore);
    await service.load();

    loader.failing.add('zh-CN');
    settings.update({ language: 'zh-CN' });
    TestBed.tick();
    await service.load();

    expect(translate.getCurrentLang()).toBe('zh-TW');
    expect(translate.instant('greeting')).toBe('hello zh-TW');
    expect(document.documentElement.lang).toBe('zh-TW');

    // The file is back (e.g. after a deployment): loading again downloads it.
    loader.failing.delete('zh-CN');
    await service.load();

    expect(translate.getCurrentLang()).toBe('zh-CN');
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('should follow changes of the browser languages while the setting is auto', () => {
    browserLanguages = ['en-GB'];
    window.dispatchEvent(new Event('languagechange'));

    expect(service.current()).toBe('en-US');
  });

  it('should list the selectable languages', () => {
    expect(service.languages.map(({ code }) => code)).toEqual(['en-US', 'zh-CN', 'zh-TW']);
  });
});
