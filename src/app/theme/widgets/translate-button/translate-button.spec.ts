/**
 * Unit tests for `TranslateButton`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/translate-button --inline-template --inline-style`
 *      generated the "should create" test.
 *   2. Replaced it with tests through the opened menu: every language plus "System" as
 *      `menuitemradio`s, the current choice checked, and a click updating the `language` setting.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { TranslateButton } from './translate-button';

describe('TranslateButton', () => {
  let fixture: ComponentFixture<TranslateButton>;

  async function openMenu(): Promise<HTMLButtonElement[]> {
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    return Array.from(document.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TranslateButton);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should name the button and list the languages with the current one checked', async () => {
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'header.language'
    );

    const items = await openMenu();

    expect(items.map(item => item.querySelector('.label')?.textContent?.trim())).toEqual([
      'English',
      '简体中文',
      '繁體中文',
      'system',
    ]);
    expect(items.map(item => item.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'false',
      'true',
    ]);
    expect(items[1].getAttribute('lang')).toBe('zh-CN');
  });

  it('should change the language setting', async () => {
    const items = await openMenu();

    items[2].click();

    expect(TestBed.inject(SettingsStore).options().language).toBe('zh-TW');
  });
});
