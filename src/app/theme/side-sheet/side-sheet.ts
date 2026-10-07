/**
 * `SideSheet.open()`: shows a component or template as a full-height panel at the inline end.
 *
 * How this file was built:
 *   1. `yarn ng g service theme/side-sheet/side-sheet` generated an empty `@Service()` class and
 *      its spec.
 *   2. `open()` calls `MatDialog.open()` positioned at the end side of the current direction
 *      (right in LTR, left in RTL), full height, 320px wide (at most the viewport), with the
 *      `matero-side-sheet` panel class that src/styles/_side-sheet.scss squares off.
 *   3. While a sheet is open, a direction change (e.g. from the customizer) moves it to the new
 *      end side and gives its overlay the new `dir` (first: CDK places `left`/`right` according
 *      to the overlay's direction), through the CDK `DialogRef` that MatDialog
 *      registers with the root `Dialog` under the same id (`MatDialogRef` keeps its own private).
 *      The content already injects the application's live `Directionality`: the sheet does not
 *      set `direction`, which would make CDK provide a fixed copy.
 *
 * Why: the notice panel and the customizer slide in from the side. ng-matero used a second
 * `mat-sidenav` and `MtxDrawer` (@ng-matero/extensions); a dialog gives both the focus trap,
 * Escape handling, focus restoration and `role="dialog"` with no extra dependency, and keeps the
 * layout's sidenav container to the navigation drawer only.
 */
import { Direction, Directionality } from '@angular/cdk/bidi';
import { Dialog } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Service, TemplateRef } from '@angular/core';
import { DialogPosition, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

/** Panel class of every side sheet (styled in src/styles/_side-sheet.scss). */
export const SIDE_SHEET_CLASS = 'matero-side-sheet';

@Service()
export class SideSheet {
  readonly #dialog = inject(MatDialog);
  readonly #cdkDialog = inject(Dialog);
  readonly #dir = inject(Directionality);

  /** Opens `content` at the inline end; `config` adds to or overrides the side-sheet defaults. */
  open<T, D = unknown, R = unknown>(
    content: ComponentType<T> | TemplateRef<T>,
    config: MatDialogConfig<D> = {}
  ): MatDialogRef<T, R> {
    const ref = this.#dialog.open<T, D, R>(content, {
      position: endPosition(this.#dir.value),
      width: '320px',
      maxWidth: '100vw',
      height: '100%',
      maxHeight: '100%',
      panelClass: SIDE_SHEET_CLASS,
      ...config,
    });
    const directionChanges = this.#dir.change.subscribe(dir => {
      // The overlay copied the direction when it opened. A fixed `direction` (from the caller or
      // MAT_DIALOG_DEFAULT_OPTIONS, merged into the CDK config) stays, as CDK gave the content a
      // fixed Directionality too. First: CDK places `left`/`right` by the overlay direction.
      const cdkRef = this.#cdkDialog.getDialogById(ref.id);
      if (cdkRef && !cdkRef.config.direction) {
        cdkRef.overlayRef.setDirection(dir);
      }
      ref.updatePosition(config.position ?? endPosition(dir));
    });
    ref.afterClosed().subscribe(() => directionChanges.unsubscribe());
    return ref;
  }
}

function endPosition(dir: Direction): DialogPosition {
  return dir === 'rtl' ? { left: '0' } : { right: '0' };
}
