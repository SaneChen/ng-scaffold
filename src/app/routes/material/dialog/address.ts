/**
 * DialogAddress content; generated with `yarn ng g component routes/material/dialog/address
 * --flat --inline-template --inline-style --skip-tests` and rewritten with translated controls.
 * Tested through its parent page's real overlay interactions.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';
import { inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required, maxLength } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  imports: [
    MatButtonModule,
    TranslatePipe,
    MatDialogModule,
    FormField,
    FormRoot,
    MatFormFieldModule,
    MatInputModule,
  ],
  selector: 'app-dialog-address',
  styles: `
    mat-form-field {
      inline-size: 100%;
    }
  `,
  template: `
    <h2 mat-dialog-title>{{ key + '.address' | translate }}</h2>
    <form [formRoot]="form">
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>{{ key + '.company' | translate }}</mat-label>
          <input matInput disabled value="ng-scaffold" />
        </mat-form-field>
        @for (field of fields; track field.name) {
          <mat-form-field>
            <mat-label>{{ key + '.' + field.name | translate }}</mat-label>
            <input matInput [formField]="form[field.name]" [autocomplete]="field.autocomplete" />
            @if (form[field.name]().invalid()) {
              <mat-error>{{ key + '.invalid' | translate }}</mat-error>
            }
          </mat-form-field>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>{{ key + '.cancel' | translate }}</button>
        <button matButton="filled" type="submit">{{ key + '.submit' | translate }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class DialogAddress {
  protected readonly key = 'demo.material.dialog';
  readonly #ref = inject(MatDialogRef<DialogAddress>);
  protected readonly fields = [
    { name: 'firstName', autocomplete: 'given-name' },
    { name: 'lastName', autocomplete: 'family-name' },
    { name: 'address', autocomplete: 'street-address' },
    { name: 'address2', autocomplete: 'address-line2' },
    { name: 'city', autocomplete: 'address-level2' },
    { name: 'state', autocomplete: 'address-level1' },
    { name: 'postal', autocomplete: 'postal-code' },
  ] as const;
  protected readonly values = signal({
    firstName: '',
    lastName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postal: '',
  });
  protected readonly form = form(
    this.values,
    path => {
      required(path.firstName);
      required(path.lastName);
      required(path.address);
      required(path.city);
      required(path.postal);
      maxLength(path.postal, 10);
    },
    {
      submission: {
        action: async () => {
          this.#ref.close(this.values());
          return undefined;
        },
        onInvalid: root => root().errorSummary()[0]?.fieldTree().focusBoundControl(),
      },
    }
  );
}
