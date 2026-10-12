/**
 * Full-width, inset and vertical divider examples.
 * How this file was built: `yarn ng g component routes/material/divider`, then added
 * translated lists and a vertical flex layout using public Material components.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [MatCardModule, MatDividerModule, MatListModule, TranslatePipe, PageHeader],
  selector: 'app-material-divider',
  styleUrl: './divider.scss',
  templateUrl: './divider.html',
})
export class MaterialDivider {
  protected readonly examples = ['full', 'inset', 'vertical'];
  protected readonly items = [1, 2, 3];
}
