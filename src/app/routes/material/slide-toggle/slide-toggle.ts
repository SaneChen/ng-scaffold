/**
 * Slide toggle demo (`/material/slide-toggle`): `mat-slide-toggle` bound to a value, disabled,
 * and required in a form.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/slide-toggle` generated the component, template,
 *      styles and spec; the class was renamed `MaterialSlideToggle`.
 *   2. One Signal Form holds the toggles. The terms must be accepted (a `validate()` rule with a
 *      translated message); a valid submit confirms in a toast, an invalid one focuses the toggle
 *      through `MatSlideToggle.focus()` (like the sign-up page's checkbox).
 *
 * Why: ng-matero used `ngModel` and native validation (an English browser bubble) and confirmed
 * in a snack bar with a typo.
 */
import { Component, inject, signal, viewChild } from '@angular/core';
import { form, FormField, FormRoot, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Toaster } from '@core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCardModule,
    MatSlideToggleModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-material-slide-toggle',
  styleUrl: './slide-toggle.scss',
  templateUrl: './slide-toggle.html',
})
export class MaterialSlideToggle {
  readonly #toaster = inject(Toaster);
  readonly #translate = inject(TranslateService);

  private readonly termsToggle = viewChild.required('terms', { read: MatSlideToggle });

  protected readonly values = signal({ email: true, music: false, terms: false });
  protected readonly form = form(
    this.values,
    path => {
      validate(path.terms, ({ value }) =>
        value()
          ? undefined
          : { kind: 'terms', message: 'demo.material.slide_toggle.terms.required' }
      );
    },
    {
      submission: {
        action: async () => {
          this.#toaster.success(
            this.#translate.instant('demo.material.slide_toggle.terms.accepted')
          );
          return undefined;
        },
        // `mat-slide-toggle` is bound as a ControlValueAccessor, which Signal Forms cannot focus.
        onInvalid: () => this.termsToggle().focus(),
      },
    }
  );
}
