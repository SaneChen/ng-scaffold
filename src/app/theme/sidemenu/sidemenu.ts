/**
 * `<app-sidemenu>`: the navigation tree of the side menu, as an accordion.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/sidemenu` generated the component, template, styles and spec.
 *   2. Renders `MenuStore.visibleMenu` (already filtered by permissions) recursively with one
 *      `ng-template`: router links (`routerLinkActive` + `ariaCurrentWhenActive="page"`),
 *      external links (new tab announced to screen readers) and groups (a `<button>` with
 *      `aria-expanded` / `aria-controls` toggling its `<ul>`).
 *   3. `expanded` is a `linkedSignal` of the active trail (`MenuStore.trail(url)`): navigating
 *      opens the groups of the current page; toggling a group closes its siblings (accordion) and
 *      lasts until the next navigation.
 *   4. `compact` input: the collapsed rail shows icons (or the first letter of a sub-item) only.
 *   5. Tag values go through the translate pipe; a numeric badge is followed by a visually
 *      hidden "new", so the link reads "Dashboard 5 new" rather than "Dashboard 5" (and still
 *      contains its visible text, for speech input).
 *
 * Why: ng-matero needed three directives that registered items imperatively, re-checked the open
 * state on router events and on a debounced menu stream, used ngx-permissions per item and
 * exposed neither `aria-expanded` nor `aria-current`. Here the open state is derived from two
 * signals (URL and menu).
 */
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { buildRoute, isMenuCount, MenuItem, MenuStore, menuTagClass } from '@core';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';

@Component({
  imports: [
    NgTemplateOutlet,
    MatIconModule,
    MatRippleModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  selector: 'app-sidemenu',
  styleUrl: './sidemenu.scss',
  templateUrl: './sidemenu.html',
  host: {
    '[class.compact]': 'compact()',
  },
})
export class Sidemenu {
  readonly #store = inject(MenuStore);
  readonly #router = inject(Router);

  /** Icon-only presentation for the collapsed rail. */
  readonly compact = input(false);

  protected readonly menu = this.#store.visibleMenu;

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

  /** Names of the open groups. */
  protected readonly expanded = linkedSignal(() => new Set(this.trail()));

  protected readonly tagClass = menuTagClass;
  protected readonly isCount = isMenuCount;

  protected route(parents: readonly string[], item: MenuItem): string {
    return buildRoute(...parents, item.route);
  }

  /** DOM id of a group's list, derived from its unique translation-key name. */
  protected listId(item: MenuItem): string {
    return `sidemenu-${item.name.replace(/[^\w-]/g, '-')}`;
  }

  protected toggle(item: MenuItem): void {
    this.expanded.update(open => {
      if (open.has(item.name)) {
        return new Set([...open].filter(name => !isSelfOrDescendant(name, item.name)));
      }
      // Accordion: keep the item's ancestors open, close everything else.
      return new Set([...[...open].filter(name => isSelfOrDescendant(item.name, name)), item.name]);
    });
  }
}

/** Names are dotted paths (`menu.material.button`): a descendant's name extends its ancestor's. */
function isSelfOrDescendant(name: string, ancestor: string): boolean {
  return name === ancestor || name.startsWith(`${ancestor}.`);
}
