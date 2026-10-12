/**
 * MaterialProgressSpinner demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/progress-spinner` generated
 * the component and spec; the examples use signals, local resources and M3 theme variants.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    FormField,
    MatProgressSpinnerModule,
    MatSliderModule,
  ],
  selector: 'app-material-progress-spinner',
  styleUrl: './progress-spinner.scss',
  templateUrl: './progress-spinner.html',
})
export class MaterialProgressSpinner {
  protected readonly key = 'demo.material.progress_spinner';
  protected readonly values = signal({ progress: 40 });
  protected readonly form = form(this.values);
  protected readonly variants = ['primary', 'tertiary', 'error'];
}
