/**
 * Radio button demo (`/material/radio`): `mat-radio-group` with a bound value, labels before the
 * buttons, a disabled button and colour variants.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/radio` generated the component, template, styles and
 *      spec; the class was renamed `MaterialRadio`.
 *   2. A Signal Form holds the favourite season; every set of buttons is a labelled group, so the
 *      arrow keys move between them.
 *
 * Why: ng-matero used `ngModel`, ungrouped buttons, an `align` attribute that does nothing and
 * M2 colours.
 */
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [FormField, MatCardModule, MatRadioModule, PageHeader, TranslatePipe],
  selector: 'app-material-radio',
  styleUrl: './radio.scss',
  templateUrl: './radio.html',
})
export class MaterialRadio {
  protected readonly seasons = ['winter', 'spring', 'summer', 'autumn'];
  protected readonly breads = ['toast', 'biscuit', 'bagel'];
  protected readonly variants = ['primary', 'tertiary', 'error'];

  protected readonly values = signal({ season: 'autumn' });
  protected readonly form = form(this.values);
}
