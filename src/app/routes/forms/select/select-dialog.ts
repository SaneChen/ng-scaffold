/**
 * The dialog of the select demo: an `mtx-select` inside a `MatDialog`.
 *
 * How this file was built: `yarn ng g component routes/forms/select/select-dialog --flat
 * --inline-template --inline-style` generated the component and its spec; the class was renamed
 * `FormsSelectDialog`.
 *
 * Why: shows that the select's panel opens above the dialog (ng-matero's "Select in dialog").
 */
import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MtxSelect } from '@ng-matero/extensions/select';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [
    FormField,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MtxSelect,
    TranslatePipe,
  ],
  selector: 'app-forms-select-dialog',
  styles: `
    mat-form-field {
      inline-size: 100%;
    }
  `,
  template: `
    <h2 mat-dialog-title>{{ 'demo.forms.select.dialog.title' | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field>
        <mat-label>{{ 'demo.forms.select.dialog.city' | translate }}</mat-label>
        <mtx-select [items]="cities" bindLabel="label" bindValue="value" [formField]="form.city" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button matButton type="button" mat-dialog-close>{{ 'close' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class FormsSelectDialog {
  protected readonly cities = [
    { value: 1, label: 'Vilnius' },
    { value: 2, label: 'Kaunas' },
    { value: 3, label: 'Pavilnys', disabled: true },
  ];

  protected readonly form = form(signal<{ city: number | null }>({ city: null }));
}
