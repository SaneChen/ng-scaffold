/**
 * Dynamic forms demo (`/forms/dynamic`): forms described as data and rendered by ngx-formly with
 * its Material types, a custom `combobox` type and the grid classes for the layout.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/dynamic` generated the component, template, styles and
 *      spec; the class was renamed `FormsDynamic`.
 *   2. ng-matero's two examples with formly 9 names (`props`, `expressions`): a field enabled by
 *      another one, and an advanced layout (`fieldGroupClassName: 'row'`, `col-sm-*` classes).
 *      Labels, placeholders, descriptions and the city names are observables of the translations,
 *      so they follow the language; submitting a valid form shows its model in a toast.
 *
 * Why: ng-matero used the deprecated `templateOptions` / `expressionProperties`, English labels
 * and the formly configuration in the application's root providers.
 */
import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Toaster } from '@core';
import { FormlyFieldConfig, FormlyForm } from '@ngx-formly/core';
import { PageHeader } from '@shared';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';

const CITIES = ['beijing', 'shanghai', 'guangzhou', 'shenzhen'];

@Component({
  imports: [
    FormlyForm,
    MatButtonModule,
    MatCardModule,
    PageHeader,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  selector: 'app-forms-dynamic',
  styleUrl: './dynamic.scss',
  templateUrl: './dynamic.html',
})
export class FormsDynamic {
  readonly #translate = inject(TranslateService);
  readonly #toaster = inject(Toaster);

  protected readonly simple = new FormGroup({});
  protected readonly simpleModel: Record<string, unknown> = { email: 'email@example.com' };
  protected readonly simpleFields: FormlyFieldConfig[] = [
    {
      key: 'text',
      type: 'input',
      props: { required: true },
      expressions: this.#texts('text'),
    },
    {
      key: 'text2',
      type: 'input',
      expressions: { ...this.#texts('text2'), 'props.disabled': '!model.text' },
    },
    {
      key: 'email',
      type: 'input',
      props: { type: 'email', required: true, attributes: { autocomplete: 'email' } },
      validators: { validation: [Validators.email] },
      expressions: this.#texts('email'),
    },
  ];

  protected readonly advanced = new FormGroup({});
  protected readonly advancedModel: Record<string, unknown> = {};
  protected readonly advancedFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          className: 'col-sm-6',
          key: 'firstName',
          type: 'input',
          props: { required: true, attributes: { autocomplete: 'given-name' } },
          expressions: this.#texts('first_name'),
        },
        {
          className: 'col-sm-6',
          key: 'lastName',
          type: 'input',
          props: { required: true, attributes: { autocomplete: 'family-name' } },
          expressions: { ...this.#texts('last_name'), 'props.disabled': '!model.firstName' },
        },
      ],
    },
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          className: 'col-sm-6',
          key: 'street',
          type: 'input',
          props: { attributes: { autocomplete: 'street-address' } },
          expressions: this.#texts('street'),
        },
        {
          className: 'col-sm-3',
          key: 'cityId',
          type: 'combobox',
          props: { labelProp: 'name', valueProp: 'id', required: true },
          expressions: {
            ...this.#texts('city'),
            'props.options': this.#cities(),
            'props.description': this.#text('city_description'),
          },
        },
        {
          className: 'col-sm-3',
          key: 'zip',
          type: 'input',
          props: { pattern: '\\d{5}', attributes: { autocomplete: 'postal-code' } },
          expressions: this.#texts('zip'),
          validation: { messages: { pattern: () => this.#text('zip_pattern') } },
        },
      ],
    },
    { key: 'otherInput', type: 'textarea', expressions: this.#texts('other_input') },
    { key: 'otherToo', type: 'checkbox', expressions: this.#texts('other_checkbox') },
  ];

  protected submit(form: FormGroup, model: Record<string, unknown>): void {
    if (form.valid) {
      this.#toaster.success(JSON.stringify(model));
    }
  }

  protected reset(form: FormGroup): void {
    form.reset();
  }

  #text(key: string): Observable<string> {
    return this.#translate.stream(`demo.forms.dynamic.fields.${key}`);
  }

  /** The translated label and, when the translations have one, placeholder of a field. */
  #texts(key: string): Record<string, Observable<string>> {
    return {
      'props.label': this.#text(key),
      'props.placeholder': this.#translate
        .stream(`demo.forms.dynamic.placeholders.${key}`)
        .pipe(map(text => (text.startsWith('demo.') ? '' : text))),
    };
  }

  #cities(): Observable<{ id: number; name: string }[]> {
    return this.#translate
      .stream(CITIES.map(city => `demo.forms.dynamic.cities.${city}`))
      .pipe(
        map(names =>
          CITIES.map((city, i) => ({ id: i + 1, name: names[`demo.forms.dynamic.cities.${city}`] }))
        )
      );
  }
}
