/**
 * Unit tests for `PageTitleStrategy`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/title/page-title-strategy` generated the "should be created" test.
 *   2. Added tests that navigate with `RouterTestingHarness` and check the document title through
 *      the `Title` service: application name only, translated page title, plain-text titles and
 *      a language switch. Translations are set in memory, and the title is emptied before each
 *      test because `document` is shared by all tests of the file.
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { PageTitleStrategy } from './page-title-strategy';

@Component({ template: '' })
class Page {}

describe('PageTitleStrategy', () => {
  let service: PageTitleStrategy;
  let title: Title;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideRouter([
          { path: '', component: Page },
          { path: 'dashboard', title: 'menu.dashboard', component: Page },
          { path: 'about', title: 'About us', component: Page },
        ]),
        { provide: TitleStrategy, useExisting: PageTitleStrategy },
      ],
    });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', { menu: { dashboard: 'Dashboard' } });
    translate.use('en-US');
    title = TestBed.inject(Title);
    // The document outlives each test: start empty, so every assertion sees only this test's work.
    title.setTitle('');
    service = TestBed.inject(PageTitleStrategy);
    service.setAppName('ng-scaffold');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show the application name as soon as it is set', () => {
    expect(title.getTitle()).toBe('ng-scaffold');
  });

  it('should keep only the application name on routes without a title', async () => {
    await RouterTestingHarness.create('/');

    expect(title.getTitle()).toBe('ng-scaffold');
  });

  it('should prefix the translated route title', async () => {
    await RouterTestingHarness.create('/dashboard');

    expect(title.getTitle()).toBe('Dashboard · ng-scaffold');
  });

  it('should use route titles that are not i18n keys as they are', async () => {
    await RouterTestingHarness.create('/about');

    expect(title.getTitle()).toBe('About us · ng-scaffold');
  });

  it('should retitle the current page when the language changes', async () => {
    await RouterTestingHarness.create('/dashboard');

    translate.setTranslation('zh-CN', { menu: { dashboard: '仪表盘' } });
    translate.use('zh-CN');
    TestBed.tick();

    expect(title.getTitle()).toBe('仪表盘 · ng-scaffold');
  });
});
