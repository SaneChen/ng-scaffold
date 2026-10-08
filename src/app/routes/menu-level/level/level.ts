/**
 * Menu level demo (`/menu-level/...`): the page behind the leaves of the deeply nested demo menu.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/menu-level/level --inline-template --inline-style` generated
 *      the component and its spec; the class was renamed `MenuLevelPage`.
 *   2. Shows the menu trail of the current page (`injectMenuTrail()`) as an ordered list, with
 *      its depth.
 *
 * Why: ng-matero's menu-level links had no route and fell through to the dashboard, so the deep
 * menu could not be tried; one page serves all of its leaves.
 */
import { Component, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { injectMenuTrail, PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatCardModule, PageHeader, TranslatePipe],
  selector: 'app-menu-level-page',
  styles: `
    ol {
      margin: 0.5rem 0 0;
    }
  `,
  template: `
    <app-page-header />
    <mat-card appearance="outlined">
      <mat-card-content>
        <p>{{ 'demo.menu_level.depth' | translate: { depth: trail().length } }}</p>
        <p>{{ 'demo.menu_level.path' | translate }}</p>
        <ol>
          @for (name of trail(); track name) {
            <li>{{ name | translate }}</li>
          }
        </ol>
      </mat-card-content>
    </mat-card>
  `,
})
export class MenuLevelPage {
  readonly #trail = injectMenuTrail();

  protected readonly trail = computed(() => this.#trail().map(item => item.name));
}
