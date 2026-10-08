/**
 * The ngx-formly configuration of the forms demo area.
 *
 * How this file was built: written by hand (route providers; no generator for them).
 * `provideDemoFormly()`: formly with its Material types, the custom `combobox` type, and
 * validation messages from the translations (as observables, so they follow the language).
 *
 * Why: ng-matero configured formly in the application's root providers, so every application
 * built from it carried formly; here it lives with the only pages that use it.
 */
import { inject, Provider } from '@angular/core';
import { ConfigOption, FORMLY_CONFIG, provideFormlyCore } from '@ngx-formly/core';
import { withFormlyMaterial } from '@ngx-formly/material';
import { TranslateService } from '@ngx-translate/core';
import { FormlyFieldCombobox } from './dynamic/combobox-type';

export function provideDemoFormly(): Provider[] {
  return [
    provideFormlyCore([
      ...withFormlyMaterial(),
      { types: [{ name: 'combobox', component: FormlyFieldCombobox, wrappers: ['form-field'] }] },
    ]),
    {
      provide: FORMLY_CONFIG,
      multi: true,
      useFactory: (): ConfigOption => {
        const translate = inject(TranslateService);
        const limit = (key: string, prop: string) => (_: unknown, field: { props?: object }) =>
          translate.stream(`validation.${key}`, {
            number: (field.props as Record<string, unknown> | undefined)?.[prop],
          });
        return {
          validationMessages: [
            { name: 'required', message: () => translate.stream('validation.required') },
            { name: 'email', message: () => translate.stream('validation.invalid_email') },
            { name: 'pattern', message: () => translate.stream('validation.pattern') },
            { name: 'min', message: limit('min', 'min') },
            { name: 'max', message: limit('max', 'max') },
            { name: 'minLength', message: limit('min_length', 'minLength') },
            { name: 'maxLength', message: limit('max_length', 'maxLength') },
          ],
        };
      },
    },
  ];
}
