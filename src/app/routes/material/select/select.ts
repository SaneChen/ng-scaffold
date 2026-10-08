/**
 * Select demo (`/material/select`): `mat-select` with single and multiple selection, option
 * groups (one disabled) and colour variants.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/select` generated the component, template, styles
 *      and spec; the class was renamed `MaterialSelect`.
 *   2. One Signal Form holds the selections; every option label is translated.
 *
 * Why: ng-matero used `ngModel`, English labels, M2 colours and trademarked creature names as
 * sample groups (here: produce).
 */
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

export const PRODUCE = [
  { name: 'fruits', items: ['apple', 'banana', 'cherry'], disabled: false },
  { name: 'vegetables', items: ['carrot', 'pepper', 'spinach'], disabled: false },
  { name: 'herbs', items: ['basil', 'mint', 'thyme'], disabled: true },
  { name: 'grains', items: ['rice', 'oats'], disabled: false },
];

@Component({
  imports: [
    FormField,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-material-select',
  styleUrl: './select.scss',
  templateUrl: './select.html',
})
export class MaterialSelect {
  protected readonly colors = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow', 'black'];
  protected readonly primaryColors = this.colors.slice(0, 3);
  protected readonly toppings = [
    'pepperoni',
    'mushrooms',
    'onions',
    'sausage',
    'bacon',
    'cheese',
    'olives',
    'peppers',
    'pineapple',
    'spinach',
  ];
  protected readonly produce = PRODUCE;
  protected readonly variants = ['primary', 'tertiary', 'error'];

  protected readonly values = signal({
    color: '',
    toppings: [] as string[],
    produce: '',
  });
  protected readonly form = form(this.values);
}
