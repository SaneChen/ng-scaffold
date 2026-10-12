/**
 * MaterialRipple demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/ripple` generated
 * the component and spec; the examples use signals, local resources and M3 theme variants.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { signal } from '@angular/core';
import { form, FormField, min, max } from '@angular/forms/signals';
import { MatRipple } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    FormField,
    MatRipple,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  selector: 'app-material-ripple',
  styleUrl: './ripple.scss',
  templateUrl: './ripple.html',
})
export class MaterialRipple {
  protected readonly key = 'demo.material.ripple';
  protected readonly values = signal({
    centered: false,
    disabled: false,
    unbounded: false,
    radius: 80,
    color: '',
  });
  protected readonly form = form(this.values, path => {
    min(path.radius, 0);
    max(path.radius, 300);
  });
  protected launch(event: MouseEvent, ripple: MatRipple): void {
    if (event.detail === 0 && !this.values().disabled) {
      ripple.launch(0, 0, { centered: true }).fadeOut();
    }
  }
}
