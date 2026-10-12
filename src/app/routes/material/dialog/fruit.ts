/**
 * DialogFruit content; generated with `yarn ng g component routes/material/dialog/fruit
 * --flat --inline-template --inline-style --skip-tests` and rewritten with translated controls.
 * Tested through its parent page's real overlay interactions.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  imports: [MatButtonModule, TranslatePipe, MatDialogModule],
  selector: 'app-dialog-fruit',
  styles: ``,
  template: `
    <h2 mat-dialog-title>{{ key + '.fruit' | translate }}</h2>
    <mat-dialog-content>{{ key + '.choose' | translate }}</mat-dialog-content>
    <mat-dialog-actions>
      <button matButton type="button" mat-dialog-close="peach">
        {{ key + '.peach' | translate }}
      </button>
      <button matButton type="button" mat-dialog-close="apple">
        {{ key + '.apple' | translate }}
      </button>
      <button matButton type="button" mat-dialog-close>{{ key + '.cancel' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class DialogFruit {
  protected readonly key = 'demo.material.dialog';
}
