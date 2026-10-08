/**
 * `<app-profile-form>`: the profile form of the form-elements demo, in one or two columns.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/profile-form` generated the component, template, styles
 *      and spec; the class was renamed `ProfileForm`.
 *   2. A Signal Form over the ten fields of ng-matero's example (username, gender, mobile, email,
 *      city, address, company, telephone, website, date): `required` and `email` rules, Material
 *      inputs, a `mat-select` and a datepicker bound with `[formField]`, translated labels and
 *      errors, `autocomplete` tokens.
 *   3. `columns` input (1 or 2) lays the fields out with the grid classes; Save confirms with a
 *      toast, Cancel restores the initial values.
 *   4. The datepicker's standalone directives are imported, not `MatDatepickerModule`: the
 *      module provides `MatDatepickerIntl` itself, which would hide the translated one of the
 *      demo route (`provideDemoDates()`).
 *
 * Why: ng-matero repeated the same reactive form twice in its template with English labels and a
 * save button that did nothing.
 */
import { Component, inject, input, signal } from '@angular/core';
import { email, FormField, FormRoot, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Toaster } from '@core';
import { ValidationMessagePipe } from '@shared';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

export interface Profile {
  username: string;
  gender: '' | 'male' | 'female';
  mobile: string;
  email: string;
  city: string;
  address: string;
  company: string;
  tele: string;
  website: string;
  date: Date | null;
}

export const EMPTY_PROFILE: Profile = {
  username: '',
  gender: '',
  mobile: '',
  email: '',
  city: '',
  address: '',
  company: '',
  tele: '',
  website: '',
  date: null,
};

@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    ValidationMessagePipe,
  ],
  selector: 'app-profile-form',
  styleUrl: './profile-form.scss',
  templateUrl: './profile-form.html',
})
export class ProfileForm {
  readonly #toaster = inject(Toaster);
  readonly #translate = inject(TranslateService);

  /** One column, or two from the sm breakpoint. */
  readonly columns = input<1 | 2>(1);

  protected readonly model = signal<Profile>({ ...EMPTY_PROFILE });

  protected readonly form = form(
    this.model,
    path => {
      required(path.username);
      required(path.gender);
      required(path.mobile);
      required(path.email);
      email(path.email);
    },
    {
      submission: {
        action: async () => {
          this.#toaster.success(this.#translate.instant('demo.forms.saved'));
          return undefined;
        },
        onInvalid: field => field().errorSummary()[0]?.fieldTree().focusBoundControl(),
      },
    }
  );

  protected cancel(): void {
    this.form().reset({ ...EMPTY_PROFILE });
  }

  protected column(): string {
    return this.columns() === 2 ? 'col-sm-6' : '';
  }
}
