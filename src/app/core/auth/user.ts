/**
 * The signed-in user, as returned by `GET /user`.
 *
 * How this file was built:
 *   1. `yarn ng g interface core/auth/user` generated an empty interface.
 *   2. Added ng-matero's fields with concrete types (ng-matero allowed any extra property and typed
 *      `roles` as `any[]`).
 *
 * Why: the header, the user panel and the permission store read these fields; anything else a
 * backend sends is ignored by the type system instead of being silently `any`.
 */
export interface User {
  id: number | string;
  name: string;
  email: string;
  /** Image URL (relative to the deployment, e.g. `images/avatar.jpg`, or absolute). */
  avatar?: string;
  /** Role names, e.g. `['ADMIN']`; `PermissionStore` maps them to permissions. */
  roles: string[];
  /** Permissions granted directly to this user, in addition to those of the roles. */
  permissions?: string[];
}
