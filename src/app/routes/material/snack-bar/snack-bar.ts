/**
 * MaterialSnackBar demo with translated overlay controls.
 * How this file was built: `yarn ng g component routes/material/snack-bar` generated
 * the page; overlays inherit its translation injector and close when the page is destroyed.
 * Bottom-sheet and snack-bar labels are captured on open, so language changes dismiss them.
 */
import { Component } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import {
  DestroyRef,
  effect,
  inject,
  signal,
  TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, min, max } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    FormField,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  selector: 'app-material-snack-bar',
  styleUrl: './snack-bar.scss',
  templateUrl: './snack-bar.html',
})
export class MaterialSnackBar {
  protected readonly key = 'demo.material.snack_bar';
  readonly #snack = inject(MatSnackBar);
  readonly #dir = inject(Directionality);
  readonly #direction = this.#dir.valueSignal;
  readonly #translate = inject(TranslateService);
  readonly #view = inject(ViewContainerRef);
  readonly #texts = toSignal(this.#translate.stream('demo.material.snack_bar'));
  #dismiss: (() => void) | undefined;
  private readonly template = viewChild.required<TemplateRef<unknown>>('snack');
  protected readonly horizontal = ['start', 'end', 'left', 'right', 'center'];
  protected readonly vertical = ['top', 'bottom'];
  protected readonly values = signal({
    message: '',
    action: true,
    actionLabel: '',
    autoHide: true,
    duration: 5000,
    custom: false,
    horizontal: 'center' as MatSnackBarHorizontalPosition,
    vertical: 'bottom' as MatSnackBarVerticalPosition,
  });
  protected readonly form = form(this.values, path => {
    min(path.duration, 1000);
    max(path.duration, 60000);
  });
  constructor() {
    effect(() => {
      this.#texts();
      this.#direction();
      this.#dismiss?.();
    });
    inject(DestroyRef).onDestroy(() => this.#dismiss?.());
  }
  protected message(): string {
    return (
      this.values().message || this.#translate.instant('demo.material.snack_bar.default_message')
    );
  }
  private config(): MatSnackBarConfig {
    const values = this.values();
    return {
      viewContainerRef: this.#view,
      direction: this.#direction(),
      horizontalPosition: values.horizontal,
      verticalPosition: values.vertical,
      duration: values.autoHide
        ? Math.min(60000, Math.max(1000, Number.isFinite(values.duration) ? values.duration : 5000))
        : 0,
      panelClass: values.custom ? 'demo-snack' : undefined,
      announcementMessage: this.message(),
    };
  }
  protected open(): void {
    const values = this.values();
    const action = values.action
      ? values.actionLabel || this.#translate.instant('demo.material.snack_bar.close')
      : '';
    const ref = this.#snack.open(this.message(), action, this.config());
    this.#dismiss = () => ref.dismiss();
  }
  protected openTemplate(): void {
    const ref = this.#snack.openFromTemplate(this.template(), this.config());
    this.#dismiss = () => ref.dismiss();
  }
  protected dismiss(): void {
    this.#dismiss?.();
  }
}
