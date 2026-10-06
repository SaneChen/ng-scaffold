/**
 * `<app-user-panel>`: the signed-in user's avatar, name and email at the top of the side menu.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/user-panel` generated the component, template, styles and spec.
 *   2. A router link to the profile page with the avatar (`NgOptimizedImage`, default SVG when the
 *      user has none) and the user's name and email from `AuthStore.user`; `compact` shrinks it to
 *      the avatar in the collapsed rail.
 *
 * Why: ng-matero used a `<div>` with `routerLink`, which keyboard users could not reach, and
 * removed its focus outline.
 */
import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@core';
import { DEFAULT_AVATAR } from '../widgets/user-button/user-button';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-user-panel',
  styleUrl: './user-panel.scss',
  templateUrl: './user-panel.html',
  host: {
    '[class.compact]': 'compact()',
  },
})
export class UserPanel {
  /** Avatar only, for the collapsed rail. */
  readonly compact = input(false);

  protected readonly user = inject(AuthStore).user;
  protected readonly avatar = computed(() => this.user()?.avatar || DEFAULT_AVATAR);
}
