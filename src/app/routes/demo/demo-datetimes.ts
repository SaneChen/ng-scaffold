/**
 * The date-time picker of @ng-matero/extensions for the demo pages: its date-fns adapter, a
 * locale that follows the language and translated labels.
 *
 * How this file was built: written by hand (route providers; no generator for them).
 *   1. `provideDemoDatetimes()`: everything of `provideDemoDates()` (Material's adapter, which the
 *      extensions' adapter delegates to), `provideDateFnsDatetimeAdapter()`, and an environment
 *      initializer whose effect sets the date-fns `Locale` of the language on the datetime adapter.
 *   2. `DemoDatetimepickerIntl`: the picker's labels from `demo.dates.*`.
 *
 * Why: kept apart from demo-dates.ts so that pages with a plain datepicker do not download the
 * date-time picker.
 */
import {
  effect,
  EnvironmentProviders,
  inject,
  Injectable,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { LanguageStore } from '@core';
import { DatetimeAdapter } from '@ng-matero/extensions/core';
import { MtxDatetimepickerIntl } from '@ng-matero/extensions/datetimepicker';
import { provideDateFnsDatetimeAdapter } from '@ng-matero/extensions-date-fns-adapter';
import { TranslateService } from '@ngx-translate/core';
import { DATE_LABELS, dateLabel, dateLocale, provideDemoDates } from './demo-dates';

@Injectable()
export class DemoDatetimepickerIntl extends MtxDatetimepickerIntl {
  readonly #translate = inject(TranslateService);

  constructor() {
    super();
    effect(() => {
      const text = (key: string) => dateLabel(this.#translate, key);
      for (const key of DATE_LABELS) {
        this[key] = text(key);
      }
      this.switchToYearViewLabel = text('switchToYearViewLabel');
      this.switchToClockHourViewLabel = text('switchToClockHourViewLabel');
      this.switchToClockMinuteViewLabel = text('switchToClockMinuteViewLabel');
      this.okLabel = text('okLabel');
      this.cancelLabel = text('cancelLabel');
      this.changes.next();
    });
  }
}

/** Route providers of the demo pages with the extensions' date-time picker. */
export function provideDemoDatetimes(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideDemoDates(),
    provideDateFnsDatetimeAdapter(),
    { provide: MtxDatetimepickerIntl, useClass: DemoDatetimepickerIntl },
    provideEnvironmentInitializer(() => {
      const language = inject(LanguageStore);
      const datetimes = inject(DatetimeAdapter);
      // Typed `string`, but the date-fns adapter it delegates to takes a date-fns `Locale`.
      effect(() => datetimes.setLocale(dateLocale(language.current()) as unknown as string));
    }),
  ]);
}
