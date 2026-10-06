/**
 * `<app-user-button>`: the signed-in user's avatar, opening the account menu.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/user-button --inline-template --inline-style` generated
 *      the component and its spec.
 *   2. Avatar from `AuthStore.user` (public/images/avatar-default.svg when the user has none)
 *      through `NgOptimizedImage`; menu items "Profile" (/profile/overview), "Edit profile"
 *      (/profile/settings), "Restore defaults" (`SettingsStore.reset()`) and "Log out"
 *      (`AuthStore.logout()`, which also opens the login page).
 *
 * Why: in ng-matero the profile pages were not part of the starter, the reset reloaded the page
 * (settings are signals here, so the layout updates in place) and the button had no accessible
 * name. The menu items are router links, not buttons that navigate.
 */
import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { AuthStore, SettingsStore } from '@core';
import { TranslatePipe } from '@ngx-translate/core';

/** Shown for users without an avatar. */
export const DEFAULT_AVATAR = 'images/avatar-default.svg';

@Component({
  imports: [
    NgOptimizedImage,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
  ],
  selector: 'app-user-button',
  styles: `
    img {
      border-radius: var(--mat-sys-corner-full);
    }
  `,
  template: `
    <button
      matIconButton
      type="button"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="
        user()?.name
          ? ('header.account' | translate: { name: user()?.name })
          : ('header.account_anonymous' | translate)
      "
    >
      <img [ngSrc]="avatar()" width="24" height="24" alt="" />
    </button>

    <mat-menu #menu="matMenu">
      <a mat-menu-item routerLink="/profile/overview">
        <mat-icon>account_circle</mat-icon>
        <span>{{ 'profile' | translate }}</span>
      </a>
      <a mat-menu-item routerLink="/profile/settings">
        <mat-icon>edit</mat-icon>
        <span>{{ 'edit_profile' | translate }}</span>
      </a>
      <button mat-menu-item type="button" (click)="restoreDefaults()">
        <mat-icon>restore</mat-icon>
        <span>{{ 'restore_defaults' | translate }}</span>
      </button>
      <button mat-menu-item type="button" (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>{{ 'logout' | translate }}</span>
      </button>
    </mat-menu>
  `,
})
export class UserButton {
  readonly #auth = inject(AuthStore);
  readonly #settings = inject(SettingsStore);

  protected readonly user = this.#auth.user;
  protected readonly avatar = computed(() => this.user()?.avatar || DEFAULT_AVATAR);

  protected restoreDefaults(): void {
    this.#settings.reset();
  }

  protected logout(): void {
    void this.#auth.logout();
  }
}
