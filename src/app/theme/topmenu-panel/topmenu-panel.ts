/**
 * `<app-topmenu-panel>`: one dropdown level of the top menu (a `mat-menu`), nested for sub-groups.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/topmenu-panel` generated the component, template, styles and
 *      spec.
 *   2. Inputs `items`, `parents` (route segments of the enclosing groups) and `trail` (names on the
 *      path to the current page); `menu` exposes the `MatMenu` for the parent's
 *      `matMenuTriggerFor`. Router links carry `aria-current="page"`, groups open the next level
 *      (this component, recursively), external links announce a new tab.
 *
 * Why: ng-matero rendered the top menu as a `mat-tab-nav-bar` (tabs semantics for menu buttons)
 * and tracked the active group with `active` signals written into the menu data from router
 * subscriptions; here "active" is read from the trail that `Topmenu` derives.
 */
import { Component, input, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { buildRoute, MenuItem } from '@core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatIconModule, MatMenuModule, RouterLink, RouterLinkActive, TranslatePipe],
  selector: 'app-topmenu-panel',
  styleUrl: './topmenu-panel.scss',
  templateUrl: './topmenu-panel.html',
})
export class TopmenuPanel {
  readonly items = input<readonly MenuItem[]>([]);
  readonly parents = input<readonly string[]>([]);
  readonly trail = input<ReadonlySet<string>>(new Set());

  /** The dropdown, for the parent's `[matMenuTriggerFor]`. */
  readonly menu = viewChild.required(MatMenu);

  protected route(item: MenuItem): string {
    return buildRoute(...this.parents(), item.route);
  }
}
