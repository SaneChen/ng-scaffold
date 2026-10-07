/**
 * `<app-topmenu>`: horizontal main navigation below the header (navigation position "top").
 *
 * How this file was built:
 *   1. `yarn ng g component theme/topmenu` generated the component, template, styles and spec.
 *   2. Renders the top level of `MenuStore.visibleMenu` inside a named `<nav>` as Material buttons:
 *      router links (`aria-current="page"`), groups opening a `TopmenuPanel` dropdown
 *      (`mat-menu`, nested for deeper levels), external links. The trail of the current URL
 *      (`MenuStore.trail`) highlights the group that contains the current page.
 *   3. The icons are direct children of the buttons, so they land in Material's icon slots; only
 *      the name and the tags come from a shared template. The layout makes the `app-topmenu`
 *      element sticky below the header.
 *   4. Tags as in the side menu: translated values, a hidden "new" after numeric badges; the tags
 *      are inline blocks, so no stray spaces inside the pills and the accessible name keeps a
 *      space between the name and a tag ("Design New", not "DesignNew").
 *
 * Why: ng-matero used `mat-tab-nav-bar`, which announced menu buttons as tabs of a tab panel, and
 * mutated `active` signals inside the menu data from several router subscriptions.
 */
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { buildRoute, isMenuCount, MenuStore, menuTagClass } from '@core';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { TopmenuPanel } from '../topmenu-panel/topmenu-panel';

@Component({
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    TopmenuPanel,
  ],
  selector: 'app-topmenu',
  styleUrl: './topmenu.scss',
  templateUrl: './topmenu.html',
})
export class Topmenu {
  readonly #store = inject(MenuStore);
  readonly #router = inject(Router);

  protected readonly menu = this.#store.visibleMenu;
  protected readonly buildRoute = buildRoute;
  protected readonly tagClass = menuTagClass;
  protected readonly isCount = isMenuCount;

  readonly #url = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.#router.url }
  );

  /** Names of the items on the path to the current page. */
  protected readonly trail = computed(
    () => new Set(this.#store.trail(this.#url(), this.menu()).map(item => item.name))
  );
}
