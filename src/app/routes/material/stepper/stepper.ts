/**
 * Responsive stepper with linear validation, backwards navigation and reset.
 * How this file was built: `yarn ng g component routes/material/stepper`, then used Signal
 * Forms directly as step controls, supported by the installed CDK v22 StepControl type.
 */
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepper, MatStepperIntl, MatStepperModule } from '@angular/material/stepper';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { map } from 'rxjs';
import { textAt } from '../../demo/demo-translations';

function createStepperIntl(): MatStepperIntl {
  const intl = new MatStepperIntl();
  const labels = toSignal(inject(TranslateService).stream('demo.material.stepper'));
  effect(() => {
    const current = labels();
    intl.editableLabel = textAt(current, 'editable');
    intl.optionalLabel = textAt(current, 'optional');
    intl.completedLabel = textAt(current, 'completed');
    intl.changes.next();
  });
  return intl;
}

@Component({
  imports: [
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    TranslatePipe,
    PageHeader,
  ],
  selector: 'app-material-stepper',
  providers: [{ provide: MatStepperIntl, useFactory: createStepperIntl }],
  styleUrl: './stepper.scss',
  templateUrl: './stepper.html',
})
export class MaterialStepper {
  protected readonly linear = signal(false);
  protected readonly values = signal({ name: '', address: '' });
  protected readonly form = form(this.values, path => {
    required(path.name);
    required(path.address);
  });
  protected readonly narrow = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 599.98px)')
      .pipe(map(state => state.matches)),
    { initialValue: false }
  );

  protected reset(stepper: MatStepper): void {
    stepper.reset();
    this.form().reset({ name: '', address: '' });
  }
}
