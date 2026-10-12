/**
 * MaterialButtonToggle demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/button-toggle` generated
 * the component and spec; the examples use signals, local resources and M3 theme variants.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [MatCardModule, TranslatePipe, PageHeader, MatButtonToggleModule, MatIconModule],
  selector: 'app-material-button-toggle',
  styleUrl: './button-toggle.scss',
  templateUrl: './button-toggle.html',
})
export class MaterialButtonToggle {
  protected readonly key = 'demo.material.button_toggle';
  protected readonly pie = signal('apple');
  protected readonly pies = ['apple', 'cherry', 'pecan'];
  protected readonly alignments = ['left', 'center', 'right', 'justify'];
  protected readonly groceries = ['flour', 'eggs', 'sugar', 'milk'];
}
