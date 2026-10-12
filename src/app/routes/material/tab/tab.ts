/**
 * Routed weather tabs and dynamic-height tabs with a disabled breed.
 * How this file was built: `yarn ng g component routes/material/tab`, then replaced the
 * placeholder with a tab navigation panel, lazy child routes and translated breed content.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [
    MatCardModule,
    MatTabsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    PageHeader,
  ],
  selector: 'app-material-tab',
  styleUrl: './tab.scss',
  templateUrl: './tab.html',
})
export class MaterialTab {
  protected readonly weather = ['sunny', 'rainy', 'foggy'];
  protected readonly breeds = ['husky', 'beagle', 'labrador'];
}
