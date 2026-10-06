/**
 * `<app-translate-button>`: menu to choose the interface language.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/translate-button --inline-template --inline-style`
 *      generated the component and its spec.
 *   2. Lists `LANGUAGES` (native names, untranslated) plus "System" (`auto`); the current choice
 *      is a checked `menuitemradio`; selecting calls `SettingsStore.update({ language })`, and
 *      `LanguageStore` loads and applies the language.
 *
 * Why: ng-matero hard-coded its own list ("中文简体", "中文繁体"), marked the choice with a visual
 * pseudo-checkbox only and gave the icon button no accessible name.
 */
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { LANGUAGES, SettingsStore } from '@core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  selector: 'app-translate-button',
  styles: `
    .checked {
      color: var(--mat-sys-primary);
    }
  `,
  template: `
    <button
      matIconButton
      type="button"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="'header.language' | translate"
    >
      <mat-icon>translate</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      @for (option of options; track option.code) {
        @let checked = option.code === current();
        <button
          mat-menu-item
          type="button"
          role="menuitemradio"
          [attr.aria-checked]="checked"
          [class.checked]="checked"
          [attr.lang]="option.code === 'auto' ? null : option.code"
          (click)="choose(option.code)"
        >
          <mat-icon>{{ checked ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
          <span class="label">
            {{ option.code === 'auto' ? ('system' | translate) : option.label }}
          </span>
        </button>
      }
    </mat-menu>
  `,
})
export class TranslateButton {
  readonly #settings = inject(SettingsStore);

  protected readonly options = [...LANGUAGES, { code: 'auto', label: '' }];
  protected readonly current = computed(() => this.#settings.options().language);

  protected choose(language: string): void {
    this.#settings.update({ language });
  }
}
