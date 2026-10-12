/**
 * DialogWelcome content; generated with `yarn ng g component routes/material/dialog/welcome
 * --flat --inline-template --inline-style --skip-tests` and rewritten with translated controls.
 * Tested through its parent page's real overlay interactions.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  imports: [MatButtonModule, TranslatePipe, MatDialogModule],
  selector: 'app-dialog-welcome',
  styles: ``,
  template: `
    <h2 mat-dialog-title>{{ key + '.welcome' | translate }}</h2>
    <mat-dialog-content>
      <p>{{ key + '.welcome_text' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" mat-dialog-close>{{ key + '.close' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class DialogWelcome {
  protected readonly key = 'demo.material.dialog';
}
