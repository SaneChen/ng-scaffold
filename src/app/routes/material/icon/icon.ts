/**
 * MaterialIcon demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/icon` generated
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
  selector: 'app-material-icon',
  styleUrl: './icon.scss',
  templateUrl: './icon.html',
})
export class MaterialIcon {
  protected readonly key = 'demo.material.icon';
  protected readonly deleted = signal(false);
}
