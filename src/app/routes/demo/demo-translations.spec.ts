/**
 * Unit tests for the demo translations.
 *
 * How this file was built: written by hand with demo-translations.ts.
 *   1. The demo files public/i18n/demo/*.json have the same keys in every language.
 *   2. Through a real route: the page waits for the demo file of the current language, shows its
 *      keys next to the application's, and follows a language change.
 */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService, TranslatePipe, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../public/i18n/demo/en-US.json';
import zhCN from '../../../../public/i18n/demo/zh-CN.json';
import zhTW from '../../../../public/i18n/demo/zh-TW.json';
import { demoTranslationsReady, provideDemoTranslations } from './demo-translations';

@Component({
  imports: [TranslatePipe],
  template: `
    {{ 'demo.greeting' | translate }} / {{ 'app.name' | translate }}
  `,
})
class DemoPage {}

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe('demo translations', () => {
  it.each([503, 200])(
    'should redirect an unusable dictionary (%i) and refetch on re-entry',
    async status => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideTranslateService(),
          provideRouter([
            {
              path: 'demo',
              providers: provideDemoTranslations(),
              canActivate: [demoTranslationsReady],
              component: DemoPage,
            },
            { path: '500', component: DemoPage },
          ]),
        ],
      });
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('en-US', { app: { name: 'Admin' } });
      translate.use('en-US');
      const http = TestBed.inject(HttpTestingController);
      const harness = await RouterTestingHarness.create();
      const failed = harness.navigateByUrl('/demo');
      await new Promise(resolve => setTimeout(resolve));
      const request = http.expectOne('i18n/demo/en-US.json');
      if (status === 503) request.flush(null, { status: 503, statusText: 'Unavailable' });
      else request.flush({});
      await failed;
      expect(TestBed.inject(Router).url).toBe('/500');
      const retry = harness.navigateByUrl('/demo');
      await new Promise(resolve => setTimeout(resolve));
      http.expectOne('i18n/demo/en-US.json').flush({ demo: { greeting: 'Recovered' } });
      await retry;
      expect(harness.routeNativeElement?.textContent?.trim()).toBe('Recovered / Admin');
      http.verify();
    }
  );
  it('should have the same keys in every language, all under "demo"', () => {
    const english = keys(enUS).sort();

    expect(keys(zhCN).sort()).toEqual(english);
    expect(keys(zhTW).sort()).toEqual(english);
    expect(english.every(key => key.startsWith('demo.'))).toBe(true);
  });

  it('should load the demo file of the current language before showing a page', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        provideRouter([
          {
            path: 'demo',
            providers: provideDemoTranslations(),
            canActivate: [demoTranslationsReady],
            component: DemoPage,
          },
        ]),
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', { app: { name: 'Admin' } });
    translate.setTranslation('zh-CN', { app: { name: '后台' } });
    translate.use('en-US');
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();

    const navigation = harness.navigateByUrl('/demo');
    // The route's child service (and its request) is created once the navigation reaches it.
    await new Promise(resolve => setTimeout(resolve));
    http.expectOne('i18n/demo/en-US.json').flush({ demo: { greeting: 'Hello' } });
    await navigation;
    expect(harness.routeNativeElement?.textContent?.trim()).toBe('Hello / Admin');

    translate.use('zh-CN');
    http.expectOne('i18n/demo/zh-CN.json').flush({ demo: { greeting: '你好' } });
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent?.trim()).toBe('你好 / 后台');
    http.verify();
  });
});
