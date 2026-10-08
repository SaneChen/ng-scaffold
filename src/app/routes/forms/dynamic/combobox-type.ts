/**
 * The `combobox` field type of the dynamic forms demo: an `mtx-select` inside a Material form
 * field, with its options from `props.options` (an array or an observable).
 *
 * How this file was built: `yarn ng g component routes/forms/dynamic/combobox-type --flat
 * --inline-template --inline-style` generated the component and its spec; the class was renamed
 * `FormlyFieldCombobox` and extends formly's Material `FieldType`. It is tested through the page
 * that uses it (dynamic.spec.ts), so the generated spec was removed.
 *
 * Why: ng-matero's example of a custom formly type, kept with the demo that registers it
 * (forms.routes.ts) instead of the shared folder of the starter.
 */
import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MtxToObservablePipe } from '@ng-matero/extensions/core';
import { MtxSelect } from '@ng-matero/extensions/select';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType } from '@ngx-formly/material/form-field';

@Component({
  imports: [AsyncPipe, MtxSelect, MtxToObservablePipe, ReactiveFormsModule],
  selector: 'app-formly-field-combobox',
  template: `
    <mtx-select
      [formControl]="formControl"
      [items]="props.options | toObservable | async"
      [bindLabel]="labelProp()"
      [bindValue]="valueProp()"
      [required]="props.required ?? false"
      [placeholder]="props.placeholder ?? ''"
    />
  `,
})
export class FormlyFieldCombobox extends FieldType<FieldTypeConfig> {
  protected labelProp(): string {
    return typeof this.props['labelProp'] === 'string' ? this.props['labelProp'] : 'label';
  }

  protected valueProp(): string | undefined {
    return typeof this.props['valueProp'] === 'string' ? this.props['valueProp'] : undefined;
  }
}
