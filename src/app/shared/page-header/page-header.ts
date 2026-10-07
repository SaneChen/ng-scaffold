/**
 * `<app-page-header>`: the heading of a page with its subtitle and breadcrumb.
 *
 * How this file was built:
 *   1. `yarn ng g component shared/page-header --inline-template --inline-style` generated the
 *      component and its spec.
 *   2. Inputs `heading`, `subtitle`, `nav` (passed to the breadcrumb) and `hideBreadcrumb`.
 *      `text` is a `computed()`: the `heading` input, else the name of the current page in the
 *      menu (`injectMenuTrail()`), else the title of the route; all are translated. The input is
 *      not called `title` (ng-matero's name): a static `title="…"` attribute would also reach the
 *      host element and show the key as a tooltip.
 *   3. Styled with system tokens (primary colors, medium corners) instead of fixed colors.
 *
 * Why: ng-matero computed the title once from `router.url` (it never updated when a page was
 * reused) and colored the header `#0074e9` with semi-transparent white text in both themes.
 */
import { booleanAttribute, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { injectMenuTrail } from '../breadcrumb/menu-trail';

@Component({
  imports: [Breadcrumb, TranslatePipe],
  selector: 'app-page-header',
  styles: `
    :host {
      display: block;
      padding: 1rem;
      margin-block-end: 1rem;
      color: var(--mat-sys-on-primary);
      background-color: var(--mat-sys-primary);
      border-radius: var(--mat-sys-corner-medium);
    }

    .title {
      display: flex;
      flex-wrap: wrap;
      column-gap: 0.5rem;
      align-items: baseline;
    }

    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }

    .subtitle {
      margin: 0;
      font: var(--mat-sys-body-medium);
    }

    app-breadcrumb {
      margin-block-start: 0.5rem;
    }
  `,
  template: `
    <div class="title">
      @if (text()) {
        <h1>{{ text() | translate }}</h1>
      }
      @if (subtitle()) {
        <p class="subtitle">{{ subtitle() | translate }}</p>
      }
    </div>
    @if (!hideBreadcrumb()) {
      <app-breadcrumb [nav]="nav()" />
    }
  `,
})
export class PageHeader {
  /** Heading (text or translation key); defaults to the page's menu name or route title. */
  readonly heading = input('');
  readonly subtitle = input('');
  /** Breadcrumb items (translation keys) instead of the menu trail. */
  readonly nav = input<readonly string[]>([]);
  readonly hideBreadcrumb = input(false, { transform: booleanAttribute });

  readonly #trail = injectMenuTrail();
  readonly #routeTitle = toSignal(inject(ActivatedRoute).title);

  protected readonly text = computed(
    () => this.heading() || this.#trail().at(-1)?.name || this.#routeTitle() || ''
  );
}
