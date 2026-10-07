/**
 * Profile settings (`/profile/settings`): edits the signed-in user's name and email.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/profile/settings` generated the component, template, styles
 *      and spec; the class was renamed `ProfileSettings`.
 *   2. A Signal Form over a `linkedSignal` of `AuthStore.user`: the fields show the loaded user
 *      and start over from it whenever it changes (loaded late, saved, another sign-in);
 *      `required` name, `required` + `email` email, `autocomplete`.
 *   3. The submission action awaits `AuthStore.updateProfile()` (`PATCH /user`) and announces the
 *      result with a toast; refused values go through `serverErrors()`: field errors stay on their
 *      fields until changed, the others go to `failures`, an alert region cleared at every
 *      submit.
 *
 * Why: ng-matero's form had ten required fields that its `User` model does not hold, untranslated
 * labels and messages, and a save button without a handler.
 */
import { Component, inject, linkedSignal, signal } from '@angular/core';
import { email, FormField, FormRoot, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore, Toaster } from '@core';
import { serverErrors, ValidationMessagePipe } from '@shared';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    ValidationMessagePipe,
  ],
  selector: 'app-profile-settings',
  styleUrl: './settings.scss',
  templateUrl: './settings.html',
})
export class ProfileSettings {
  readonly #auth = inject(AuthStore);
  readonly #toaster = inject(Toaster);
  readonly #translate = inject(TranslateService);

  protected readonly model = linkedSignal(() => {
    const user = this.#auth.user();
    return { name: user?.name ?? '', email: user?.email ?? '' };
  });

  /** Messages (or translation keys) of the last refused save not tied to a field. */
  protected readonly failures = signal<string[]>([]);

  protected readonly form = form(
    this.model,
    path => {
      required(path.name);
      required(path.email);
      email(path.email);
    },
    {
      submission: {
        action: async field => {
          this.failures.set([]);
          try {
            await this.#auth.updateProfile(field().value());
          } catch (error) {
            const errors = serverErrors(error, { name: field.name, email: field.email });
            this.failures.set(errors.filter(e => !e.fieldTree).map(e => e.message ?? ''));
            return errors.filter(e => e.fieldTree);
          }
          this.#toaster.success(this.#translate.instant('profile_page.saved'));
          return undefined;
        },
        onInvalid: field => field().errorSummary()[0]?.fieldTree().focusBoundControl(),
      },
    }
  );
}
