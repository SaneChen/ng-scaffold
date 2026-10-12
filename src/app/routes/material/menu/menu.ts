/**
 * Menu demo (`/material/menu`): `mat-menu` opened from an icon button, with icons, with links and
 * nested.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/menu` generated the component, template, styles and
 *      spec; the class was renamed `MaterialMenu`.
 *   2. The items are lists of translation keys rendered with `@for`; the nested menu keeps one
 *      `mat-menu` per level.
 *
 * Why: ng-matero repeated every item by hand in English and used `http://` links.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-material-menu',
  styleUrl: './menu.scss',
  templateUrl: './menu.html',
})
export class MaterialMenu {
  protected readonly calls = [
    { icon: 'dialpad', name: 'redial' },
    { icon: 'voicemail', name: 'voicemail' },
    { icon: 'notifications_off', name: 'mute' },
  ];
  protected readonly links = [
    { href: 'https://angular.dev', name: 'Angular' },
    { href: 'https://material.angular.dev', name: 'Angular Material' },
  ];
  protected readonly invertebrates = [
    'insects',
    'molluscs',
    'crustaceans',
    'corals',
    'arachnids',
    'velvet_worms',
    'horseshoe_crabs',
  ];
  protected readonly fishes = [
    'baikal_oilfish',
    'bala_shark',
    'ballan_wrasse',
    'bamboo_shark',
    'banded_killifish',
  ];
  protected readonly amphibians = ['sonoran_toad', 'western_toad', 'arroyo_toad', 'yosemite_toad'];
  protected readonly reptiles = ['day_gecko', 'gila_monster', 'tree_monitor', 'spiny_lizard'];
}
