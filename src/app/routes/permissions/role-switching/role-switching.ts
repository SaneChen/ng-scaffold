/**
 * Role switching demo (`/permissions/role-switching`): changing the role updates the menu and every
 * permission check at once.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/role-switching` generated the component, template,
 *      styles and spec; the class was renamed `PermissionsRoleSwitching`.
 *   2. A card with the `RoleSwitcher` and an explanation; the side menu reacts by itself because
 *      `MenuStore.visibleMenu` is computed from `PermissionStore`.
 *
 * Why: ng-matero pointed to ngx-permissions, which this project replaces with its own signals.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';
import { RoleSwitcher } from '../role-switcher/role-switcher';

@Component({
  imports: [MatCardModule, PageHeader, RoleSwitcher, TranslatePipe],
  selector: 'app-permissions-role-switching',
  styleUrl: './role-switching.scss',
  templateUrl: './role-switching.html',
})
export class PermissionsRoleSwitching {}
