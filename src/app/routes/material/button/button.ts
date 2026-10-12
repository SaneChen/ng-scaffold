/**
 * MaterialButton demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/button` generated
 * the component and spec; the examples use signals, local resources and M3 theme variants.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  imports: [MatCardModule, TranslatePipe, PageHeader, MatButtonModule, MatIconModule, RouterLink],
  selector: 'app-material-button',
  styleUrl: './button.scss',
  templateUrl: './button.html',
})
export class MaterialButton {
  protected readonly key = 'demo.material.button';
  protected readonly count = signal(0);
  protected readonly appearances = ['text', 'filled', 'elevated', 'outlined', 'tonal'] as const;
  protected readonly variants = ['primary', 'tertiary', 'error'];
  protected increase(): void {
    this.count.update(count => count + 1);
  }
}
