/**
 * Unit tests for `provideDemoDates()`.
 *
 * How this file was built: written by hand with demo-dates.ts. Through an environment injector
 * with the providers: the adapter uses the date-fns locale of the current language and switches
 * with it, and the datepicker's labels come from the translations.
 */
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { SettingsStore } from '@core';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideDemoDates } from './demo-dates';
import enUS from '../../../../public/i18n/demo/en-US.json';
import zhCN from '../../../../public/i18n/demo/zh-CN.json';
import zhTW from '../../../../public/i18n/demo/zh-TW.json';

describe('provideDemoDates', () => {
  let injector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    injector = createEnvironmentInjector([provideDemoDates()], TestBed.inject(EnvironmentInjector));
  });

  afterEach(() => localStorage.clear());

  it('should format dates in the language of the settings', () => {
    const dates = injector.get(DateAdapter<Date>);
    const day = new Date(2026, 9, 15);
    expect(dates.format(day, 'PPPP')).toBe('Thursday, October 15th, 2026');

    TestBed.inject(SettingsStore).update({ language: 'zh-CN' });
    TestBed.tick();

    expect(dates.format(day, 'EEEE')).toBe('星期四');
  });

  it('should translate the datepicker labels', () => {
    // LanguageStore (behind the date locale) keeps the language of the settings: en-US.
    TestBed.inject(TranslateService).setTranslation('en-US', {
      demo: { dates: { openCalendarLabel: 'Open the calendar' } },
    });
    const datepicker = injector.get(MatDatepickerIntl);
    TestBed.tick();

    expect(datepicker.openCalendarLabel).toBe('Open the calendar');
  });

  it('should translate the multi-year range description in all supported languages', () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    translate.setTranslation('zh-CN', zhCN);
    translate.setTranslation('zh-TW', zhTW);
    const intl = injector.get(MatDatepickerIntl);
    TestBed.tick();
    expect(intl.formatYearRangeLabel('2016', '2039')).toBe('2016 to 2039');
    TestBed.inject(SettingsStore).update({ language: 'zh-CN' });
    TestBed.tick();
    expect(intl.formatYearRangeLabel('2016', '2039')).toBe('2016 至 2039');
    TestBed.inject(SettingsStore).update({ language: 'zh-TW' });
    TestBed.tick();
    expect(intl.formatYearRangeLabel('2016', '2039')).toBe('2016 至 2039');
  });
});
