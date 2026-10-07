/**
 * The sign-up page (`/auth/signup`).
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/signup` generated the component, template, styles and
 *      spec.
 *   2. A Signal Form with username, optional email, password, password confirmation and the
 *      terms checkbox: `required`, `email`, `minLength` and two `validate()` rules (the
 *      confirmation must match the password, the terms must be accepted), each with a
 *      translation key as message.
 *   3. The submission action awaits `AuthStore.register()` (which signs the new account in for
 *      this browser session) and opens the home page; a refused registration puts its field
 *      errors on the fields (until they change) and the others in `failures`, an alert region
 *      cleared at every submit (`serverErrors()`); an invalid submit focuses the first invalid
 *      field, the terms checkbox through `MatCheckbox.focus()`.
 *
 * Why: ng-matero's form never submitted (the button had no handler), its terms checkbox was not
 * part of the form, the mismatch validator overwrote the confirmation's other errors with
 * `setErrors()`, and the fields had no `autocomplete` attributes.
 */
import { Component, inject, signal, viewChild } from '@angular/core';
import {
  email,
  FormField,
  FormRoot,
  form,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@core';
import { ValidationMessagePipe } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';
import { serverErrors } from '../server-errors';

/** Minimum password length accepted by the form. */
export const MIN_PASSWORD_LENGTH = 6;

@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    TranslatePipe,
    ValidationMessagePipe,
  ],
  selector: 'app-signup',
  styleUrl: './signup.scss',
  templateUrl: './signup.html',
})
export class Signup {
  readonly #auth = inject(AuthStore);
  readonly #router = inject(Router);

  protected readonly model = signal({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  /** Messages (or translation keys) of the last refused registration not tied to a field. */
  protected readonly failures = signal<string[]>([]);

  private readonly terms = viewChild.required(MatCheckbox);

  protected readonly form = form(
    this.model,
    path => {
      required(path.username);
      email(path.email);
      required(path.password);
      minLength(path.password, MIN_PASSWORD_LENGTH);
      required(path.confirmPassword);
      validate(path.confirmPassword, field =>
        field.value() && field.value() !== field.valueOf(path.password)
          ? { kind: 'mismatch', message: 'validation.password_mismatch' }
          : undefined
      );
      validate(path.agree, field =>
        field.value() ? undefined : { kind: 'required', message: 'validation.agree_terms' }
      );
    },
    {
      submission: {
        action: async field => {
          const { username, email, password } = field().value();
          this.failures.set([]);
          try {
            await this.#auth.register({ username, password, email: email || undefined });
          } catch (error) {
            const errors = serverErrors(error, {
              username: field.username,
              email: field.email,
              password: field.password,
            });
            // Field errors stay until the field changes; the others must not block a retry.
            this.failures.set(errors.filter(e => !e.fieldTree).map(e => e.message ?? ''));
            return errors.filter(e => e.fieldTree);
          }
          await this.#router.navigateByUrl('/');
          return undefined;
        },
        onInvalid: field => {
          const errors = field().errorSummary();
          // `mat-checkbox` is bound as a ControlValueAccessor, which Signal Forms cannot focus.
          if (errors.length > 0 && errors.length === field.agree().errors().length) {
            this.terms().focus();
          } else {
            errors[0]?.fieldTree().focusBoundControl();
          }
        },
      },
    }
  );
}
