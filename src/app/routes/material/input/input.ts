/**
 * Input demo (`/material/input`): `matInput` for names, a password with a reveal button, an
 * email with errors, a currency converter and a growing textarea with a character count.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/input` generated the component, template, styles and
 *      spec; the class was renamed `MaterialInput`.
 *   2. One Signal Form holds every value: `required()`, `email()` and `maxLength()` rules (the
 *      last one also sets the textarea's `maxlength`), errors through `validationMessage`.
 *   3. Typing an amount converts it into the other currency (`convert()`, from the typed field).
 *
 * Why: ng-matero used `ngModel`, getters and English texts.
 */
import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, signal } from '@angular/core';
import { email, form, FormField, maxLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader, ValidationMessagePipe } from '@shared';

/** Yen per dollar on 31 July 2017 (ng-matero's rate). */
export const USD_TO_JPY = 110.29;
export const COMMENT_MAX = 200;

@Component({
  imports: [
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    PageHeader,
    TextFieldModule,
    TranslatePipe,
    ValidationMessagePipe,
  ],
  selector: 'app-material-input',
  styleUrl: './input.scss',
  templateUrl: './input.html',
})
export class MaterialInput {
  protected readonly commentMax = COMMENT_MAX;
  protected readonly rate = USD_TO_JPY;
  protected readonly showPassword = signal(false);

  protected readonly values = signal({
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    usd: null as number | null,
    jpy: null as number | null,
    comment: '',
  });
  protected readonly form = form(this.values, path => {
    required(path.password);
    required(path.email);
    email(path.email);
    maxLength(path.comment, COMMENT_MAX);
  });

  /** Sets the other currency from the amount typed in `from`. */
  protected convert(from: 'usd' | 'jpy', amount: number): void {
    const known = Number.isFinite(amount);
    if (from === 'usd') {
      this.form.jpy().value.set(known ? round(amount * USD_TO_JPY) : null);
    } else {
      this.form.usd().value.set(known ? round(amount / USD_TO_JPY) : null);
    }
  }
}

function round(amount: number): number {
  return Math.round(amount * 100) / 100;
}
