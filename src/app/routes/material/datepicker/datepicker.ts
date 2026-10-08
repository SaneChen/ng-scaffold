/**
 * Datepicker demo (`/material/datepicker`): `mat-datepicker` with a maximum, a minimum, a trip
 * whose return follows the departure, and a weekday filter.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/datepicker` generated the component, template, styles
 *      and spec; the class was renamed `MaterialDatepicker`.
 *   2. One Signal Form holds the dates. `minDate()`/`maxDate()` set the limits, which Signal
 *      Forms also hands to the datepicker input (`[min]` beside `[formField]` is not allowed); the
 *      return date's minimum is the departure date when there is one. The weekday filter is a
 *      `matDatepickerFilter`.
 *   3. `ERRORS` maps each field's error kinds (Signal Forms', and the datepicker's own, reported
 *      as parse errors) to a translated message.
 *   4. The datepicker's standalone directives are imported, not `MatDatepickerModule`, which
 *      would provide an untranslated `MatDatepickerIntl` (the route provides `provideDemoDates()`).
 *
 * Why: ng-matero used `ngModel` with template references per field and English texts.
 */
import { Component, signal } from '@angular/core';
import { form, FormField, maxDate, minDate, required } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { addDays, startOfDay } from 'date-fns';

type DateName = 'birthday' | 'payment' | 'departure' | 'return' | 'appointment';

/** Message keys (under `demo.material.datepicker.errors`) of each field's error kinds. */
const ERRORS: Record<DateName, Partial<Record<string, string>>> = {
  birthday: { required: 'choose', maxDate: 'earlier', matDatepickerMax: 'earlier' },
  payment: { required: 'choose', minDate: 'later', matDatepickerMin: 'later' },
  departure: {
    required: 'choose',
    minDate: 'later',
    matDatepickerMin: 'later',
    maxDate: 'earlier',
    matDatepickerMax: 'earlier',
  },
  return: {
    minDate: 'after_departure',
    matDatepickerMin: 'after_departure',
    maxDate: 'earlier',
    matDatepickerMax: 'earlier',
  },
  appointment: {
    required: 'choose',
    minDate: 'unavailable',
    matDatepickerMin: 'unavailable',
    maxDate: 'unavailable',
    matDatepickerMax: 'unavailable',
    matDatepickerFilter: 'unavailable',
  },
};

/**
 * Saturdays and Sundays cannot be picked. `undefined` keeps the input's inferred date type
 * assignable from the `min`/`max` (`Date | undefined`) that `[formField]` passes to it.
 */
export function weekdaysOnly(date: Date | null | undefined): boolean {
  return !date || (date.getDay() !== 0 && date.getDay() !== 6);
}

@Component({
  imports: [
    FormField,
    MatCardModule,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatFormFieldModule,
    MatInputModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-material-datepicker',
  styleUrl: './datepicker.scss',
  templateUrl: './datepicker.html',
})
export class MaterialDatepicker {
  protected readonly today = startOfDay(new Date());
  protected readonly inTwoDays = addDays(this.today, 2);
  protected readonly inAMonth = addDays(this.today, 31);
  protected readonly inAYear = addDays(this.today, 365);
  protected readonly weekdaysOnly = weekdaysOnly;

  protected readonly form = form(
    signal<Record<DateName, Date | null>>({
      birthday: null,
      payment: this.inTwoDays,
      departure: null,
      return: null,
      appointment: null,
    }),
    path => {
      required(path.birthday);
      maxDate(path.birthday, this.today);
      required(path.payment);
      minDate(path.payment, this.inTwoDays);
      required(path.departure);
      minDate(path.departure, this.today);
      maxDate(path.departure, this.inAYear);
      minDate(path.return, field => field.valueOf(path.departure) ?? this.today);
      maxDate(path.return, this.inAYear);
      required(path.appointment);
      minDate(path.appointment, this.today);
      maxDate(path.appointment, this.inAYear);
    }
  );

  /** The message key of a field's first error. */
  protected message(name: DateName, kind: string): string {
    return `demo.material.datepicker.errors.${ERRORS[name][kind] ?? 'invalid'}`;
  }
}
