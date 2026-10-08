/**
 * Permission test demo (`/permissions/test`, ADMIN only): the forms of the `*appCan` directive,
 * evaluated live while permissions are granted and revoked.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/test` generated the component, template, styles
 *      and spec; the class was renamed `PermissionsTest`.
 *   2. Buttons grant or revoke the direct permission `canPublish`; each example shows its
 *      `*appCan` expression and what it renders right now (the template or its `else`).
 *
 * Why: ng-matero's page exercised ngx-permissions with test strings ("hhhhh", "adminnnnn"),
 * an artificial 2 s delay and untranslated texts; this page demonstrates the replacement.
 */
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Can, PermissionStore } from '@core';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';

/** The direct permission the page grants and revokes. */
export const DEMO_PERMISSION = 'canPublish';

@Component({
  imports: [Can, MatButtonModule, MatCardModule, PageHeader, TranslatePipe],
  selector: 'app-permissions-test',
  styleUrl: './test.scss',
  templateUrl: './test.html',
})
export class PermissionsTest {
  readonly #store = inject(PermissionStore);

  protected readonly permission = DEMO_PERMISSION;
  protected readonly roles = this.#store.roles;
  protected readonly permissions = this.#store.permissions;
  protected readonly granted = computed(() => this.permissions().includes(DEMO_PERMISSION));

  protected grant(): void {
    this.#store.addPermissions(DEMO_PERMISSION);
  }

  protected revoke(): void {
    this.#store.removePermissions(DEMO_PERMISSION);
  }
}
