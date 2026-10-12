/**
 * MaterialBadge demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/badge` generated
 * the component and spec; the examples use signals, local resources and M3 theme variants.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
  ],
  selector: 'app-material-badge',
  styleUrl: './badge.scss',
  templateUrl: './badge.html',
})
export class MaterialBadge {
  protected readonly key = 'demo.material.badge';
  protected readonly hidden = signal(false);
}
