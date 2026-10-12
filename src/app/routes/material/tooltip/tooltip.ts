/**
 * MaterialTooltip demo with translated overlay controls.
 * How this file was built: `yarn ng g component routes/material/tooltip` generated
 * the page; overlays inherit its translation injector and close when the page is destroyed.
 * Bottom-sheet and snack-bar labels are captured on open, so language changes dismiss them.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  imports: [MatCardModule, TranslatePipe, PageHeader, MatButtonModule, MatTooltipModule],
  selector: 'app-material-tooltip',
  styleUrl: './tooltip.scss',
  templateUrl: './tooltip.html',
})
export class MaterialTooltip {
  protected readonly key = 'demo.material.tooltip';
  protected readonly positions = ['below', 'above', 'before', 'after', 'left', 'right'] as const;
}
