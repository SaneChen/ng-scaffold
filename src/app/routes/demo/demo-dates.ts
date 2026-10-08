/**
 * Dates of the demo pages: Angular Material's date-fns adapter, a locale that follows the language
 * setting, and translated datepicker labels.
 *
 * How this file was built: written by hand (route providers; no generator for them).
 *   1. `provideDemoDates()`: `provideDateFnsAdapter()` (Material's `DateAdapter`),
 *      `MAT_DATE_LOCALE` from the current language, and an environment initializer whose effect
 *      calls `setLocale()` whenever the language changes.
 *   2. `DemoDatepickerIntl`: the datepicker's button labels from the demo translations
 *      (`demo.dates.*`), updated with the language (`changes.next()`).
 *   3. The extensions' date-time picker has its own providers (demo-datetimes.ts), so pages with
 *      a plain datepicker do not download it.
 *
 * Why: the starter ships no date picker, so the adapters live with the demo pages that use them
 * (forms, Material datepicker). ng-matero passed the language code ("zh-CN") to `setLocale()`,
 * which the date-fns adapter cannot use (it needs a date-fns `Locale`), and left the labels in
 * English.
 */
import {
  effect,
  EnvironmentProviders,
  inject,
  Injectable,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { LanguageStore } from '@core';
import { TranslateService } from '@ngx-translate/core';
import { Locale } from 'date-fns';
import { enUS, zhCN, zhTW } from 'date-fns/locale';

/** The date-fns locale of each language of `LANGUAGES`. */
const LOCALES: Readonly<Record<string, Locale>> = { 'en-US': enUS, 'zh-CN': zhCN, 'zh-TW': zhTW };

export function dateLocale(language: string): Locale {
  return LOCALES[language] ?? enUS;
}

/** Labels shared by both pickers, as `demo.dates.<key>` translations. */
export const DATE_LABELS = [
  'calendarLabel',
  'openCalendarLabel',
  'closeCalendarLabel',
  'prevMonthLabel',
  'nextMonthLabel',
  'prevYearLabel',
  'nextYearLabel',
  'prevMultiYearLabel',
  'nextMultiYearLabel',
  'switchToMonthViewLabel',
  'switchToMultiYearViewLabel',
  'startDateLabel',
  'endDateLabel',
] as const;

export function dateLabel(translate: TranslateService, key: string): string {
  return String(translate.instant(`demo.dates.${key}`));
}

@Injectable()
export class DemoDatepickerIntl extends MatDatepickerIntl {
  readonly #translate = inject(TranslateService);

  override formatYearRangeLabel(start: string, end: string): string {
    return String(this.#translate.instant('demo.dates.year_range', { start, end }));
  }

  constructor() {
    super();
    effect(() => {
      for (const key of DATE_LABELS) {
        this[key] = dateLabel(this.#translate, key);
      }
      this.changes.next();
    });
  }
}

/** Route providers of the demo pages with Material datepickers. */
export function provideDemoDates(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideDateFnsAdapter(),
    { provide: MAT_DATE_LOCALE, useFactory: () => dateLocale(inject(LanguageStore).current()) },
    { provide: MatDatepickerIntl, useClass: DemoDatepickerIntl },
    provideEnvironmentInitializer(() => {
      const language = inject(LanguageStore);
      const dates = inject(DateAdapter);
      effect(() => dates.setLocale(dateLocale(language.current())));
    }),
  ]);
}
