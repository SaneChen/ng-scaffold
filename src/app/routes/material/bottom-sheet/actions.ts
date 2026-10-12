/**
 * SheetActions content; generated with `yarn ng g component routes/material/bottom-sheet/actions
 * --flat --inline-template --inline-style --skip-tests` and rewritten with translated controls.
 * Tested through its parent page's real overlay interactions.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  imports: [MatButtonModule, TranslatePipe],
  selector: 'app-sheet-actions',
  styles: ``,
  template: `
    <h2>{{ key + '.title' | translate }}</h2>
    @for (action of actions; track action) {
      <p>
        <button matButton type="button" (click)="close(action)">
          {{ key + '.action' | translate: { number: action } }}
        </button>
      </p>
    }
    <button matButton type="button" (click)="close()">{{ key + '.close' | translate }}</button>
  `,
})
export class SheetActions {
  protected readonly key = 'demo.material.bottom_sheet';
  readonly #ref = inject(MatBottomSheetRef<SheetActions>);
  protected readonly actions = [1, 2, 3];
  protected close(action?: number): void {
    this.#ref.dismiss(action);
  }
}
