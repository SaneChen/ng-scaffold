/**
 * Dual sidenav example (`/material/sidenav/dual`): a navigation sidenav at the start and a
 * playlist sidenav at the end.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/sidenav/dual-sidenav --flat` generated the component,
 *      template, styles and spec; the class was renamed `MaterialDualSidenav`.
 *   2. Opening the playlists moves the focus to the first one (`autoFocus="first-tabbable"`; a
 *      side-mode drawer does not move it by default); playing a list confirms it in a toast (the
 *      app's `Toaster`).
 *
 * Why: ng-matero used English texts, `aria-label`s that repeated the visible text and a snack bar.
 */
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Toaster } from '@core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
  selector: 'app-material-dual-sidenav',
  styleUrl: './dual-sidenav.scss',
  templateUrl: './dual-sidenav.html',
})
export class MaterialDualSidenav {
  readonly #toaster = inject(Toaster);
  readonly #translate = inject(TranslateService);

  protected readonly examples = SIDENAV_EXAMPLES;
  protected readonly trail = exampleTrail('dual');
  protected readonly playlists = ['thumbs_up', 'last_added', 'free_purchased'];

  protected play(list: string): void {
    const name = this.#translate.instant(`demo.material.sidenav.dual.lists.${list}`);
    this.#toaster.success(this.#translate.instant('demo.material.sidenav.dual.playing', { name }));
  }
}
