/**
 * MaterialBottomSheet demo with translated overlay controls.
 * How this file was built: `yarn ng g component routes/material/bottom-sheet` generated
 * the page; overlays inherit its translation injector and close when the page is destroyed.
 * Bottom-sheet and snack-bar labels are captured on open, so language changes dismiss them.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { Directionality } from '@angular/cdk/bidi';
import {
  DestroyRef,
  effect,
  inject,
  Injector,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetConfig,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { SheetActions } from './actions';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    FormField,
    MatBottomSheetModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  selector: 'app-material-bottom-sheet',
  styleUrl: './bottom-sheet.scss',
  templateUrl: './bottom-sheet.html',
})
export class MaterialBottomSheet {
  protected readonly key = 'demo.material.bottom_sheet';
  readonly #sheet = inject(MatBottomSheet);
  readonly #injector = inject(Injector);
  readonly #translate = inject(TranslateService);
  readonly #texts = toSignal(this.#translate.stream('demo.material.bottom_sheet'));
  #dismiss: (() => void) | undefined;
  private readonly template = viewChild.required<TemplateRef<unknown>>('sheet');
  protected readonly values = signal({
    backdrop: true,
    disableClose: false,
    tinted: false,
    direction: inject(Directionality).value,
  });
  protected readonly form = form(this.values);
  protected readonly actions = [1, 2, 3];
  constructor() {
    effect(() => {
      this.#texts();
      this.#dismiss?.();
    });
    inject(DestroyRef).onDestroy(() => this.#dismiss?.());
  }
  private config(): MatBottomSheetConfig {
    const values = this.values();
    return {
      injector: this.#injector,
      hasBackdrop: values.backdrop,
      disableClose: values.disableClose,
      backdropClass: values.tinted ? 'demo-sheet-backdrop' : undefined,
      direction: values.direction,
      ariaLabel: this.#translate.instant('demo.material.bottom_sheet.title'),
    };
  }
  protected openComponent(): void {
    const ref = this.#sheet.open(SheetActions, this.config());
    this.#dismiss = () => ref.dismiss();
  }
  protected openTemplate(): void {
    const ref = this.#sheet.open(this.template(), this.config());
    this.#dismiss = () => ref.dismiss();
  }
}
