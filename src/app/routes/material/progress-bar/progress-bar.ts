/**
 * MaterialProgressBar demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/progress-bar` generated
 * the component and spec; the examples use signals, local resources and M3 theme variants.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  imports: [MatCardModule, TranslatePipe, PageHeader, MatProgressBarModule],
  selector: 'app-material-progress-bar',
  styleUrl: './progress-bar.scss',
  templateUrl: './progress-bar.html',
})
export class MaterialProgressBar {
  protected readonly key = 'demo.material.progress_bar';
  protected readonly modes = ['determinate', 'buffer', 'indeterminate', 'query'] as const;
}
