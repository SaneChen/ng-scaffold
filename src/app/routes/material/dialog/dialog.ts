/**
 * MaterialDialog demo with translated overlay controls.
 * How this file was built: `yarn ng g component routes/material/dialog` generated
 * the page; overlays inherit its translation injector and close when the page is destroyed.
 * Bottom-sheet and snack-bar labels are captured on open, so language changes dismiss them.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { DestroyRef, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogWelcome } from './welcome';
import { DialogFruit } from './fruit';
import { DialogNeptune } from './neptune';
import { DialogAddress } from './address';

@Component({
  imports: [MatCardModule, TranslatePipe, PageHeader, MatButtonModule],
  selector: 'app-material-dialog',
  styleUrl: './dialog.scss',
  templateUrl: './dialog.html',
})
export class MaterialDialog {
  protected readonly key = 'demo.material.dialog';
  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);
  readonly #destroy = inject(DestroyRef);
  readonly #ids = new Set<string>();
  protected readonly fruit = signal('');
  protected readonly submitted = signal(false);
  constructor() {
    this.#destroy.onDestroy(() => {
      for (const id of this.#ids) this.#dialog.getDialogById(id)?.close();
    });
  }
  private track<T>(reference: MatDialogRef<T>): MatDialogRef<T> {
    this.#ids.add(reference.id);
    reference
      .afterClosed()
      .pipe(takeUntilDestroyed(this.#destroy))
      .subscribe(() => this.#ids.delete(reference.id));
    return reference;
  }
  protected openWelcome(): void {
    this.track(this.#dialog.open(DialogWelcome, { injector: this.#injector }));
  }
  protected openNeptune(): void {
    this.track(this.#dialog.open(DialogNeptune, { injector: this.#injector }));
  }
  protected openFruit(): void {
    this.track(this.#dialog.open(DialogFruit, { injector: this.#injector }))
      .afterClosed()
      .pipe(takeUntilDestroyed(this.#destroy))
      .subscribe((fruit: unknown) => {
        if (fruit === 'apple' || fruit === 'peach') this.fruit.set(fruit);
      });
  }
  protected openAddress(): void {
    this.track(
      this.#dialog.open(DialogAddress, {
        injector: this.#injector,
        width: '32rem',
        maxWidth: '95vw',
      })
    )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.#destroy))
      .subscribe((address: unknown) => {
        if (address && typeof address === 'object') this.submitted.set(true);
      });
  }
}
