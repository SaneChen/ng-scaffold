/**
 * `<app-breadcrumb>`: "Home › Group › Page", derived from the current URL and the menu.
 *
 * How this file was built:
 *   1. `yarn ng g component shared/breadcrumb --inline-template --inline-style` generated the
 *      component and its spec.
 *   2. `items` is a `computed()` of the `nav` input, or else of the menu trail of the current URL
 *      (`injectMenuTrail()`); the names are translation keys.
 *   3. Markup of the WAI-ARIA breadcrumb pattern: a labelled `<nav>` with an ordered list, the
 *      home page as a router link, the last item marked `aria-current="page"`, decorative
 *      chevrons (mirrored for right-to-left text), a focus ring in the text color (visible on
 *      the primary-colored page header).
 *
 * Why: ng-matero rebuilt the items on `NavigationEnd` into a plain field (stale under OnPush),
 * linked "home" with `href="#"`, left "home" untranslated and its chevrons pointed the wrong way
 * in RTL.
 */
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectMenuTrail } from './menu-trail';

@Component({
  imports: [MatIconModule, RouterLink, TranslatePipe],
  selector: 'app-breadcrumb',
  styles: `
    :host {
      display: block;
    }

    ol {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 0;
      margin: 0;
      font: var(--mat-sys-body-medium);
      list-style: none;
    }

    li {
      display: inline-flex;
      align-items: center;
    }

    a {
      color: inherit;
      text-underline-offset: 0.2em;

      // The global ring (secondary color) vanishes on colored headers such as PageHeader's.
      &:focus-visible {
        outline-color: currentColor;
      }
    }

    mat-icon {
      width: 1.125rem;
      height: 1.125rem;
      font-size: 1.125rem;

      &:dir(rtl) {
        transform: scaleX(-1);
      }
    }
  `,
  template: `
    <nav [attr.aria-label]="'breadcrumb.label' | translate">
      <ol>
        <li>
          <a routerLink="/">{{ 'breadcrumb.home' | translate }}</a>
        </li>
        @for (name of items(); track $index) {
          <li>
            <mat-icon>chevron_right</mat-icon>
            <span [attr.aria-current]="$last ? 'page' : null">{{ name | translate }}</span>
          </li>
        }
      </ol>
    </nav>
  `,
})
export class Breadcrumb {
  /** Translation keys shown after "Home" instead of the menu trail of the current page. */
  readonly nav = input<readonly string[]>([]);

  readonly #trail = injectMenuTrail();

  protected readonly items = computed(() =>
    this.nav().length > 0 ? this.nav() : this.#trail().map(item => item.name)
  );
}
