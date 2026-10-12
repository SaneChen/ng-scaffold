/**
 * Responsive sidenav example (`/material/sidenav/mobile`): the sidenav opens over the content on
 * narrow screens and beside it on wide ones.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/sidenav/mobile-sidenav --flat` generated the
 *      component, template, styles and spec; the class was renamed `MaterialMobileSidenav`.
 *   2. `narrow` is a signal of the CDK `BreakpointObserver` (below 600px); it sets the sidenav's
 *      mode. The linked opening state closes the drawer when its mode changes, keeping focus
 *      out of content covered by a newly modal drawer. Filler paragraphs scroll independently.
 *
 * Why: ng-matero listened to a `MediaQueryList` by hand, called `detectChanges()` and fixed the
 * toolbar to the viewport with pixel offsets.
 */
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { map } from 'rxjs';
import { exampleTrail, SIDENAV_EXAMPLES } from './examples';

/** Below the Material small breakpoint (600px). */
export const NARROW = '(max-width: 599.98px)';

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
  selector: 'app-material-mobile-sidenav',
  styleUrl: './mobile-sidenav.scss',
  templateUrl: './mobile-sidenav.html',
})
export class MaterialMobileSidenav {
  protected readonly examples = SIDENAV_EXAMPLES;
  protected readonly trail = exampleTrail('mobile');
  protected readonly filler = Array.from({ length: 20 }, (_, i) => i);

  protected readonly narrow = toSignal(
    inject(BreakpointObserver)
      .observe(NARROW)
      .pipe(map(state => state.matches)),
    { initialValue: false }
  );

  protected readonly opened = linkedSignal({
    source: this.narrow,
    computation: () => false,
  });
}
