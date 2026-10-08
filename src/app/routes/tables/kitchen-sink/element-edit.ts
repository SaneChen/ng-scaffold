/**
 * The edit dialog of the kitchen-sink grid: changes an element's name, symbol and weight.
 *
 * How this file was built: `yarn ng g component routes/tables/kitchen-sink/element-edit --flat
 * --inline-template --inline-style` generated the component and its spec; the class was renamed
 * `TablesElementEdit`.
 *   1. A Signal Form over a copy of the element (`MAT_DIALOG_DATA`) with `required()` rules and a
 *      weight of at least 0; Save closes the dialog with the edited element, after validation.
 *
 * Why: ng-matero's dialog only printed the row as JSON.
 */
import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ValidationMessagePipe } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';
import { PeriodicElement } from './elements';

@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    ValidationMessagePipe,
  ],
  selector: 'app-tables-element-edit',
  styles: `
    mat-form-field {
      inline-size: 100%;
    }
  `,
  template: `
    <form [formRoot]="form">
      <h2 mat-dialog-title>
        {{ 'demo.tables.kitchen_sink.edit_title' | translate: { position: element.position } }}
      </h2>
      <mat-dialog-content>
        @for (name of textFields; track name) {
          @let field = form[name];
          <mat-form-field>
            <mat-label>{{ 'demo.tables.columns.' + name | translate }}</mat-label>
            <input matInput autocomplete="off" [formField]="field" />
            @if (field().errors()[0]; as error) {
              <mat-error>
                @let message = error | validationMessage;
                {{ message.key | translate: message.params }}
              </mat-error>
            }
          </mat-form-field>
        }
        <mat-form-field>
          <mat-label>{{ 'demo.tables.columns.weight' | translate }}</mat-label>
          <input matInput type="number" autocomplete="off" [formField]="form.weight" />
          @if (form.weight().errors()[0]; as error) {
            <mat-error>
              @let message = error | validationMessage;
              {{ message.key | translate: message.params }}
            </mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button matButton type="button" mat-dialog-close>{{ 'cancel' | translate }}</button>
        <button matButton="filled" type="submit">{{ 'save' | translate }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class TablesElementEdit {
  readonly #dialogRef = inject<MatDialogRef<TablesElementEdit, PeriodicElement>>(MatDialogRef);
  protected readonly element = inject<PeriodicElement>(MAT_DIALOG_DATA);

  protected readonly textFields = ['name', 'symbol'] as const;

  protected readonly form = form(
    signal({ ...this.element }),
    path => {
      required(path.name);
      required(path.symbol);
      required(path.weight);
      min(path.weight, 0);
    },
    {
      submission: {
        action: async field => {
          this.#dialogRef.close(field().value());
          return undefined;
        },
        onInvalid: field => field().errorSummary()[0]?.fieldTree().focusBoundControl(),
      },
    }
  );
}
