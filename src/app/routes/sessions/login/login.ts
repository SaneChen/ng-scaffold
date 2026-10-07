/**
 * The login page (`/auth/login`).
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/login` generated the component, template, styles and
 *      spec.
 *   2. A Signal Form (`form()` over a `model` signal) with `required` username and password and a
 *      "remember me" checkbox, bound with `[formField]` and submitted through `[formRoot]`
 *      (a native submit: Enter works in every field).
 *   3. The submission action awaits `AuthStore.login()`, then navigates to the `returnUrl` query
 *      parameter (set by `authGuard`) or `/`; an invalid submit focuses the first invalid field.
 *      A refused login is shown in `failures` (`serverErrors()`), an alert region cleared at every
 *      submit: wrong credentials concern both fields, and a network error must not block a retry
 *      (Signal Forms keep returned submission errors until the field's value changes).
 *   4. Errors are translated with `validationMessage`; fields carry `autocomplete` tokens; the
 *      mock API's demo account is filled in while `environment.mockApi` is on.
 *
 * Why: ng-matero used a reactive form with getters, a plain `isSubmitting` field (not refreshed
 * under OnPush), ignored `returnUrl`, disabled the button while the form was invalid (no feedback
 * on why) and had no `autocomplete` attributes.
 */
import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '@core';
import { environment } from '@env/environment';
import { ValidationMessagePipe } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';
import { serverErrors } from '../server-errors';

/** Credentials of the mock API's demo account (core/mock). */
const DEMO_ACCOUNT = environment.mockApi ? 'ng-scaffold' : '';

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
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  readonly #auth = inject(AuthStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  protected readonly model = signal({
    username: DEMO_ACCOUNT,
    password: DEMO_ACCOUNT,
    rememberMe: false,
  });

  /** Messages (or translation keys) of the last refused login. */
  protected readonly failures = signal<string[]>([]);

  protected readonly form = form(
    this.model,
    path => {
      required(path.username);
      required(path.password);
    },
    {
      submission: {
        action: async field => {
          const { username, password, rememberMe } = field().value();
          this.failures.set([]);
          try {
            await this.#auth.login(username, password, rememberMe);
          } catch (error) {
            this.failures.set(serverErrors(error, {}).map(failure => failure.message ?? ''));
            return undefined;
          }
          const returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl');
          await this.#router.navigateByUrl(returnUrl || '/');
          return undefined;
        },
        onInvalid: field => field().errorSummary()[0]?.fieldTree().focusBoundControl(),
      },
    }
  );
}
