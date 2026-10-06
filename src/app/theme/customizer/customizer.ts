/**
 * `<app-customizer>`: floating settings button and the live layout settings panel.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/customizer` generated the component, template, styles and spec.
 *   2. A FAB at the inline end corner opens the panel template through `SideSheet`. The panel
 *      shows ng-matero's options (theme; header visibility and position; user panel and navigation
 *      position; direction) as radio groups and switches bound to `SettingsStore.options()`, and
 *      every change calls `SettingsStore.update()` directly; the layout follows through signals.
 *   3. The combinations ng-matero disabled stay disabled: the header cannot be hidden while it is
 *      "above" or the navigation is at the top; "above" needs a visible header and side
 *      navigation; top navigation needs a visible header that is not "above".
 *
 * Why: ng-matero copied the settings into a reactive form, emitted the whole object to the layout
 * and applied direction and theme imperatively; it also needed `MtxDrawer`, a `DisableControl`
 * directive and `cdkDrag` for the button. Every text is translated and every group labelled.
 */
import { Component, computed, inject, TemplateRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AppSettings, SettingsStore } from '@core';
import { TranslatePipe } from '@ngx-translate/core';
import { SideSheet } from '../side-sheet/side-sheet';

/** Id of the panel's title, for the dialog's `aria-labelledby`. */
export const CUSTOMIZER_TITLE_ID = 'customizer-title';

@Component({
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatRadioModule,
    MatSlideToggleModule,
    TranslatePipe,
  ],
  selector: 'app-customizer',
  styleUrl: './customizer.scss',
  templateUrl: './customizer.html',
})
export class Customizer {
  readonly #settings = inject(SettingsStore);
  readonly #sheet = inject(SideSheet);

  protected readonly titleId = CUSTOMIZER_TITLE_ID;
  protected readonly options = this.#settings.options;

  protected readonly headerLocked = computed(
    () => this.options().headerPos === 'above' || this.options().navPos === 'top'
  );
  protected readonly aboveDisabled = computed(
    () => !this.options().showHeader || this.options().navPos === 'top'
  );
  protected readonly topDisabled = computed(
    () => !this.options().showHeader || this.options().headerPos === 'above'
  );

  protected open(panel: TemplateRef<unknown>): void {
    this.#sheet.open(panel, { ariaLabelledBy: this.titleId });
  }

  protected update(patch: Partial<AppSettings>): void {
    this.#settings.update(patch);
  }
}
