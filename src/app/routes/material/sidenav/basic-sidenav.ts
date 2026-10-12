/**
 * Basic sidenav example (`/material/sidenav/basic`): a desktop application whose menu button
 * shows and hides a side navigation.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/sidenav/basic-sidenav --flat` generated the component,
 *      template, styles and spec; the class was renamed `MaterialBasicSidenav`.
 *   2. The example runs in a frame below the page header (examples.ts gives its heading and
 *      breadcrumb); the menu button reports `aria-expanded` and the links mark the current
 *      example.
 *
 * Why: ng-matero covered the whole content area, gave the toolbar the invalid role `header`, put
 * a second `h1` on the page and used the M2 `color` input.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { exampleTrail, SIDENAV_EXAMPLES } from './examples';

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    PageHeader,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  selector: 'app-material-basic-sidenav',
  styleUrl: './basic-sidenav.scss',
  templateUrl: './basic-sidenav.html',
})
export class MaterialBasicSidenav {
  protected readonly examples = SIDENAV_EXAMPLES;
  protected readonly trail = exampleTrail('basic');
}
