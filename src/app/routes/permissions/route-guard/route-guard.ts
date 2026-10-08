/**
 * Route guard demo (`/permissions/route-guard`): the route is matched only for users who are not
 * GUEST; switching to GUEST here checks it again and leaves for the dashboard.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/route-guard` generated the component, template,
 *      styles and spec; the class was renamed `PermissionsRouteGuard`.
 *   2. The `RoleSwitcher`; after a switch the page navigates to its own URL again, so
 *      `permissionGuard` (`canMatch` in permissions.routes.ts) runs with the new role.
 *
 * Why: ng-matero sent the user to the dashboard after every switch, whether the guard would have
 * allowed the page or not; here the guard decides.
 */
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';
import { RoleSwitcher } from '../role-switcher/role-switcher';

@Component({
  imports: [MatCardModule, PageHeader, RoleSwitcher, TranslatePipe],
  selector: 'app-permissions-route-guard',
  templateUrl: './route-guard.html',
})
export class PermissionsRouteGuard {
  readonly #router = inject(Router);

  /** Navigates to this page again: route matching (and its `canMatch` guard) runs anew. */
  protected recheck(): void {
    void this.#router.navigateByUrl(this.#router.url, { onSameUrlNavigation: 'reload' });
  }
}
