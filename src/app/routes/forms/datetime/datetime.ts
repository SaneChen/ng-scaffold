/**
 * Date-time demo (`/forms/datetime`): the `mtx-datetimepicker` of @ng-matero/extensions with
 * the date-fns adapter, for dates and times, times alone, months, years, limits and a filter.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/datetime` generated the component, template, styles
 *      and spec; the class was renamed `FormsDatetime`.
 *   2. `EXAMPLES` describes the twelve pickers (type, mode, typed time, 12-hour clock, year
 *      selector, touch UI, date filter); the template renders them in one `@for`.
 *   3. One Signal Form holds the values: `required()` on every field and `minDate()`/`maxDate()`
 *      on the limited ones. Signal Forms hands those limits to the picker input as `min`/`max`
 *      (a `[min]` binding beside `[formField]` is not allowed) and reports the picker's own
 *      validators (min, max, filter, unparsable text) as parse errors, translated by
 *      `PICKER_ERRORS`.
 *   4. The hints show the limits formatted in the date-fns locale of the language.
 *   5. The picker's directives are imported one by one, like the datepicker's in the form
 *      elements demo.
 *
 * Why: ng-matero used a FormGroup, English texts and initial values outside the limits (errors
 * on load), and passed the language code to the date-fns adapter's `setLocale()`.
 */
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, maxDate, minDate, required } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LanguageStore } from '@core';
import {
  MtxDatetimepicker,
  MtxDatetimepickerFilterType,
  MtxDatetimepickerInput,
  MtxDatetimepickerMode,
  MtxDatetimepickerToggle,
  MtxDatetimepickerType,
} from '@ng-matero/extensions/datetimepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader, ValidationMessagePipe } from '@shared';
import { addDays, format, startOfMinute } from 'date-fns';
import { dateLocale } from '../../demo/demo-dates';

type DatetimeName =
  | 'datetime'
  | 'datetimeTyped'
  | 'datetimeYears'
  | 'time'
  | 'time12h'
  | 'datetime12hTyped'
  | 'date'
  | 'month'
  | 'year'
  | 'limits'
  | 'filter'
  | 'touch';

type HintName = 'soon' | 'limits' | 'filter';

/**
 * A date filter of the picker. The picker input infers its date type from the filter, and
 * `undefined` keeps that type assignable from the `min`/`max` (`Date | undefined`) that
 * `[formField]` passes to the input.
 */
type DateFilter = (date: Date | null | undefined, type: MtxDatetimepickerFilterType) => boolean;

interface Example {
  name: DatetimeName;
  type: MtxDatetimepickerType;
  mode: MtxDatetimepickerMode;
  timeInput: boolean;
  twelvehour: boolean;
  multiYearSelector: boolean;
  touchUi: boolean;
  filter: DateFilter;
  hint?: HintName;
}

/** Even years, months and days; even hours and minutes. */
const evenOnly: DateFilter = (date, type) => {
  if (!date) {
    return true;
  }
  switch (type) {
    case MtxDatetimepickerFilterType.DATE:
      return (
        date.getFullYear() % 2 === 0 && (date.getMonth() + 1) % 2 === 0 && date.getDate() % 2 === 0
      );
    case MtxDatetimepickerFilterType.HOUR:
      return date.getHours() % 2 === 0;
    case MtxDatetimepickerFilterType.MINUTE:
      return date.getMinutes() % 2 === 0;
  }
};

const anyDate: DateFilter = () => true;

const DEFAULTS = {
  type: 'datetime',
  mode: 'auto',
  timeInput: false,
  twelvehour: false,
  multiYearSelector: false,
  touchUi: false,
  filter: anyDate,
} satisfies Omit<Example, 'name'>;

/** The pickers of the page, in ng-matero's order. */
export const EXAMPLES: readonly Example[] = [
  { ...DEFAULTS, name: 'datetime', hint: 'soon' },
  { ...DEFAULTS, name: 'datetimeTyped', timeInput: true, hint: 'soon' },
  { ...DEFAULTS, name: 'datetimeYears', multiYearSelector: true, hint: 'soon' },
  { ...DEFAULTS, name: 'time', type: 'time' },
  { ...DEFAULTS, name: 'time12h', type: 'time', twelvehour: true },
  { ...DEFAULTS, name: 'datetime12hTyped', timeInput: true, twelvehour: true },
  { ...DEFAULTS, name: 'date', type: 'date' },
  { ...DEFAULTS, name: 'month', type: 'month', mode: 'portrait' },
  { ...DEFAULTS, name: 'year', type: 'year' },
  { ...DEFAULTS, name: 'limits', mode: 'landscape', hint: 'limits' },
  { ...DEFAULTS, name: 'filter', mode: 'landscape', filter: evenOnly, hint: 'filter' },
  { ...DEFAULTS, name: 'touch', mode: 'portrait', touchUi: true },
];

/** The fixed limits of the "limits" picker (ng-matero's). */
export const LIMITS = { min: new Date(2018, 10, 3, 11, 10), max: new Date(2018, 10, 4, 11, 45) };

/** Translation keys of the limit errors, of Signal Forms and of the picker's own validators. */
const PICKER_ERRORS: Partial<Record<string, string>> = {
  minDate: 'demo.forms.datetime.errors.min',
  mtxDatetimepickerMin: 'demo.forms.datetime.errors.min',
  maxDate: 'demo.forms.datetime.errors.max',
  mtxDatetimepickerMax: 'demo.forms.datetime.errors.max',
  mtxDatetimepickerFilter: 'demo.forms.datetime.errors.filter',
  mtxDatetimepickerParse: 'demo.forms.datetime.errors.parse',
};

@Component({
  imports: [
    FormField,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MtxDatetimepicker,
    MtxDatetimepickerInput,
    MtxDatetimepickerToggle,
    PageHeader,
    TranslatePipe,
    ValidationMessagePipe,
  ],
  selector: 'app-forms-datetime',
  styleUrl: './datetime.scss',
  templateUrl: './datetime.html',
})
export class FormsDatetime {
  readonly #language = inject(LanguageStore);

  /** The limits of the first three pickers: from now (to the minute) until tomorrow. */
  readonly #now = startOfMinute(new Date());
  readonly #tomorrow = addDays(this.#now, 1);

  protected readonly examples = EXAMPLES;
  protected readonly pickerErrors = PICKER_ERRORS;

  protected readonly values = signal<Record<DatetimeName, Date | null>>({
    datetime: this.#now,
    datetimeTyped: this.#now,
    datetimeYears: this.#now,
    time: null,
    time12h: null,
    datetime12hTyped: null,
    date: null,
    month: null,
    year: null,
    limits: new Date(2018, 10, 3, 12, 0),
    filter: null,
    touch: null,
  });

  protected readonly form = form(this.values, path => {
    for (const { name } of EXAMPLES) {
      required(path[name]);
    }
    for (const name of ['datetime', 'datetimeTyped', 'datetimeYears'] as const) {
      minDate(path[name], this.#now);
      maxDate(path[name], this.#tomorrow);
    }
    minDate(path.limits, LIMITS.min);
    maxDate(path.limits, LIMITS.max);
  });

  /** The interpolation parameters of each hint, with dates in the language's locale. */
  protected readonly hints = computed<Record<HintName, Record<string, string>>>(() => {
    const locale = dateLocale(this.#language.current());
    const at = (date: Date) => format(date, 'PPp', { locale });
    return {
      soon: { min: at(this.#now), max: at(this.#tomorrow) },
      limits: { min: at(LIMITS.min), max: at(LIMITS.max) },
      filter: {},
    };
  });
}
