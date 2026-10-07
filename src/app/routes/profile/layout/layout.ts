/**
 * Layout of the profile pages: the user's card with a navigation list next to the routed page.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/profile/layout` generated the component, template, styles and
 *      spec; the class was renamed `ProfileLayout`.
 *   2. Page header, a card with the signed-in user's avatar (`NgOptimizedImage`, default SVG),
 *      name and email, a `mat-nav-list` with router links (`aria-current` on the active one)
 *      and a `mat-action-list` with the logout button; the child page renders in the
 *      `<router-outlet>`.
 *
 * Why: ng-matero showed its author's bio and "Follow me" link to every user, and its logout was
 * an `<a>` without `href` that called `logout()` on click and Enter.
 */
import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '@core';
import { PageHeader } from '@shared';
import { DEFAULT_AVATAR } from '@theme';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [
    NgOptimizedImage,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    PageHeader,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
  selector: 'app-profile-layout',
  styleUrl: './layout.scss',
  templateUrl: './layout.html',
})
export class ProfileLayout {
  readonly #auth = inject(AuthStore);

  protected readonly user = this.#auth.user;
  protected readonly avatar = computed(() => this.user()?.avatar || DEFAULT_AVATAR);

  protected logout(): void {
    void this.#auth.logout();
  }
}
