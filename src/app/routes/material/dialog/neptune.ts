/**
 * DialogNeptune content; generated with `yarn ng g component routes/material/dialog/neptune
 * --flat --inline-template --inline-style --skip-tests` and rewritten with translated controls.
 * Tested through its parent page's real overlay interactions.
 */
import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';
import { DestroyRef, inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  imports: [MatButtonModule, TranslatePipe, MatDialogModule, NgOptimizedImage],
  selector: 'app-dialog-neptune',
  styles: `
    img {
      max-inline-size: 100%;
      block-size: auto;
    }
  `,
  template: `
    <h2 mat-dialog-title>{{ key + (stacked ? '.article' : '.neptune') | translate }}</h2>
    <mat-dialog-content>
      <img
        ngSrc="images/demo/neptune.svg"
        width="320"
        height="320"
        [alt]="key + '.illustration' | translate"
      />
      <p>{{ key + '.neptune_text' | translate }}</p>
      @if (stacked) {
        <p>{{ key + '.article_text' | translate }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions>
      <button matButton type="button" mat-dialog-close>{{ key + '.close' | translate }}</button>
      <a
        matButton
        href="https://en.wikipedia.org/wiki/Neptune"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ key + '.wikipedia' | translate }}
      </a>
      @if (!stacked) {
        <button matButton type="button" (click)="openArticle()">
          {{ key + '.stack' | translate }}
        </button>
      }
    </mat-dialog-actions>
  `,
})
export class DialogNeptune {
  protected readonly key = 'demo.material.dialog';
  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);
  protected readonly stacked = inject<unknown>(MAT_DIALOG_DATA) === 'article';
  #article: MatDialogRef<DialogNeptune> | undefined;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.#article?.close());
  }
  protected openArticle(): void {
    this.#article = this.#dialog.open(DialogNeptune, { data: 'article', injector: this.#injector });
  }
}
