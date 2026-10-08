/**
 * Unit tests for `provideDemoDatetimes()`.
 *
 * How this file was built: written by hand with demo-datetimes.ts. Through an environment
 * injector with the providers: the datetime adapter switches to the date-fns locale of a new
 * language, and the date-time picker's labels come from the translations.
 */
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SettingsStore } from '@core';
import { DatetimeAdapter } from '@ng-matero/extensions/core';
import { MtxDatetimepickerIntl } from '@ng-matero/extensions/datetimepicker';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { zhCN } from 'date-fns/locale';
import { provideDemoDatetimes } from './demo-datetimes';

describe('provideDemoDatetimes', () => {
  let injector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    injector = createEnvironmentInjector(
      [provideDemoDatetimes()],
      TestBed.inject(EnvironmentInjector)
    );
  });

  afterEach(() => localStorage.clear());

  it('should follow the language of the settings', () => {
    const datetimes = injector.get(DatetimeAdapter<Date>);

    TestBed.inject(SettingsStore).update({ language: 'zh-CN' });
    TestBed.tick();

    expect((datetimes as unknown as { locale: unknown }).locale).toBe(zhCN);
    expect(datetimes.getDayOfWeekNames('long')[4]).toBe('星期四');
  });

  it('should translate the date-time picker labels', () => {
    TestBed.inject(TranslateService).setTranslation('en-US', {
      demo: { dates: { openCalendarLabel: 'Open the calendar', okLabel: 'Done' } },
    });
    const intl = injector.get(MtxDatetimepickerIntl);
    TestBed.tick();

    expect(intl.openCalendarLabel).toBe('Open the calendar');
    expect(intl.okLabel).toBe('Done');
  });
});
