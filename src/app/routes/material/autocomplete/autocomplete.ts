/**
 * Autocomplete demo (`/material/autocomplete`): `mat-autocomplete` filtering a list and grouped
 * options.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/autocomplete` generated the component, template,
 *      styles and spec; the class was renamed `MaterialAutocomplete`.
 *   2. One Signal Form holds both inputs; the options are `computed()` from their values
 *      (states.ts filters and groups the names).
 *
 * Why: ng-matero mixed `ngModel` with a FormGroup and an `Observable` of groups, and kept the
 * groups as a second hand-written copy of the states.
 */
import { Component, computed, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { filterStates, groupStates } from './states';

@Component({
  imports: [
    FormField,
    MatAutocompleteModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-material-autocomplete',
  styleUrl: './autocomplete.scss',
  templateUrl: './autocomplete.html',
})
export class MaterialAutocomplete {
  protected readonly values = signal({ state: '', groupedState: '' });
  protected readonly form = form(this.values);

  protected readonly states = computed(() => filterStates(this.values().state));
  protected readonly groups = computed(() => groupStates(this.values().groupedState));
}
