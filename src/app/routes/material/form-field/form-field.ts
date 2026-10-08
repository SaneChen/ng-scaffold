/**
 * Form field demo (`/material/form-field`): `mat-form-field` around an input, a textarea and a
 * select, its required marker and floating label options, and its two M3 appearances.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/form-field` generated the component, template, styles
 *      and spec; the class was renamed `MaterialFormField`.
 *   2. A Signal Form holds the options (a checkbox and a radio group); the fields below read them.
 *
 * Why: ng-matero used a FormGroup, placeholder-only fields (no label) and showed a "standard"
 * appearance that M3 no longer has.
 */
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  FloatLabelType,
  MatFormFieldAppearance,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [
    FormField,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-material-form-field',
  styleUrl: './form-field.scss',
  templateUrl: './form-field.html',
})
export class MaterialFormField {
  protected readonly floatLabels: FloatLabelType[] = ['auto', 'always'];
  protected readonly appearances: MatFormFieldAppearance[] = ['fill', 'outline'];

  protected readonly options = signal({
    hideRequired: false,
    floatLabel: 'auto' as FloatLabelType,
  });
  protected readonly optionsForm = form(this.options);
}
