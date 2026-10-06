/**
 * Integration test for `provideI18n()`: translation files, fallback language and start-up.
 *
 * How this file was built: written by hand next to provide-i18n.ts. `provideHttpClientTesting()`
 * replaces `HttpBackend`, which the translation loader uses directly, so the requests for
 * `i18n/<code>.json` can be answered from the test, one file at a time. TestBed runs the app
 * initializers when the test module is created, like `bootstrapApplication` does.
 */
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideI18n } from './provide-i18n';

/** Lets every pending promise callback run, so `ApplicationInitStatus.done` is up to date. */
const settle = () => new Promise(resolve => setTimeout(resolve));

const NOT_FOUND = { status: 404, statusText: 'Not Found' };

describe('provideI18n', () => {
  let http: HttpTestingController;
  let initStatus: ApplicationInitStatus;

  beforeEach(() => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['zh-CN']);
    TestBed.configureTestingModule({
      providers: [provideI18n(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    initStatus = TestBed.inject(ApplicationInitStatus);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('lang');
  });

  it('should hold start-up until the current and the fallback language are loaded', async () => {
    expect(initStatus.done).toBe(false);

    http.expectOne('i18n/zh-CN.json').flush({ ok: '确定' });
    await settle();
    // English is still on its way: rendering now would show raw keys for texts zh-CN lacks.
    expect(initStatus.done).toBe(false);

    http.expectOne('i18n/en-US.json').flush({ ok: 'OK', close: 'Close' });
    await initStatus.donePromise;

    const translate = TestBed.inject(TranslateService);
    expect(translate.instant('ok')).toBe('确定');
    // Keys missing in zh-CN fall back to English.
    expect(translate.instant('close')).toBe('Close');
    expect(document.documentElement.lang).toBe('zh-CN');
    http.verify();
  });

  it('should start in English when the current language file cannot be loaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    http.expectOne('i18n/zh-CN.json').flush('Not Found', NOT_FOUND);
    http.expectOne('i18n/en-US.json').flush({ ok: 'OK' });
    await initStatus.donePromise;

    const translate = TestBed.inject(TranslateService);
    expect(translate.instant('ok')).toBe('OK');
    // <html lang> names the language whose texts are shown, not the one that failed (WCAG 3.1.1).
    expect(document.documentElement.lang).toBe('en-US');
    expect(warn).toHaveBeenCalled();
    http.verify();
  });

  it('should not block start-up when the fallback language cannot be loaded', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    http.expectOne('i18n/en-US.json').flush('Not Found', NOT_FOUND);
    http.expectOne('i18n/zh-CN.json').flush({ ok: '确定' });
    await initStatus.donePromise;

    expect(TestBed.inject(TranslateService).instant('ok')).toBe('确定');
    expect(document.documentElement.lang).toBe('zh-CN');
    http.verify();
  });
});
