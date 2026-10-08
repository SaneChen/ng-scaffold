/**
 * `<app-role-switcher>`: switches the signed-in user's role for the permission demos and shows
 * the resulting roles and permissions.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/role-switcher` generated the component, template,
 *      styles and spec; the class was renamed `RoleSwitcher`.
 *   2. A `mat-button-toggle-group` with the roles of `ROLE_PERMISSIONS`; a choice calls
 *      `PermissionStore.setRoles()` and emits `switched`. The current role and permissions are
 *      read from the store's signals.
 *
 * Why: the role-switching and route-guard pages of ng-matero each repeated this block, and kept
 * the role in a plain field next to ngx-permissions' observables (stale under OnPush).
 */
import { Component, computed, inject, output } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { PermissionStore, ROLE_PERMISSIONS } from '@core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatButtonToggleModule, TranslatePipe],
  selector: 'app-role-switcher',
  styleUrl: './role-switcher.scss',
  templateUrl: './role-switcher.html',
})
export class RoleSwitcher {
  readonly #store = inject(PermissionStore);
  readonly #rolePermissions = inject(ROLE_PERMISSIONS);

  /** Emits the new role after the store has switched to it. */
  readonly switched = output<string>();

  protected readonly roleNames = Object.keys(this.#rolePermissions);
  protected readonly roles = this.#store.roles;
  protected readonly permissions = this.#store.permissions;
  protected readonly current = computed(() => this.roles()[0] ?? null);

  protected switch(event: MatButtonToggleChange): void {
    const role = event.value as string;
    this.#store.setRoles({ [role]: this.#rolePermissions[role] ?? [] });
    this.switched.emit(role);
  }
}
