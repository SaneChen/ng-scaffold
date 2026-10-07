/**
 * Profile overview (`/profile/overview`): the signed-in user's account, roles and permissions.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/profile/overview` generated the component, template, styles
 *      and spec; the class was renamed `ProfileOverview`.
 *   2. A card with a description list read from `AuthStore.user` and `PermissionStore`.
 *
 * Why: ng-matero's overview was three tabs of lorem ipsum with stock photos; a starter page is
 * more useful when it shows what the application knows about the user.
 */
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthStore, PermissionStore } from '@core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatCardModule, TranslatePipe],
  selector: 'app-profile-overview',
  styleUrl: './overview.scss',
  templateUrl: './overview.html',
})
export class ProfileOverview {
  protected readonly user = inject(AuthStore).user;
  protected readonly roles = inject(PermissionStore).roles;
  protected readonly permissions = inject(PermissionStore).permissions;
}
