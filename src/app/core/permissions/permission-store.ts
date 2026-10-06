/**
 * Roles and permissions of the signed-in user, and the check `has({ only, except })`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/permissions/permission-store` generated an empty `@Service()`
 *      class and its spec.
 *   2. Added two private signals — the user's roles with the permissions each grants, and
 *      permissions granted directly — with read-only `roles`, `permissions` and `granted`
 *      (computed) views.
 *   3. Added the intents `setRoles()`, `addPermissions()`, `removePermissions()`, `clear()` and
 *      the check `has(rule)`, with the semantics of ngx-permissions: a name in `only` or `except`
 *      matches a role or a permission; any `except` match denies, then any `only` match allows;
 *      an empty or missing `only` allows.
 *
 * Why: replaces `ngx-permissions` (NgModule-based, observables, separate role and permission
 * services). `has()` reads signals, so a template, a `computed()` (the filtered menu) or the
 * `*appCan` directive that calls it updates by itself when the roles change, e.g. on the
 * role-switching demo page.
 */
import { computed, Service, signal } from '@angular/core';

/** Names (roles or permissions) that may (`only`) or may not (`except`) pass. */
export interface PermissionRule {
  only?: string | readonly string[];
  except?: string | readonly string[];
}

@Service()
export class PermissionStore {
  readonly #roles = signal<Readonly<Record<string, readonly string[]>>>({});
  readonly #direct = signal<readonly string[]>([]);

  /** The user's roles, e.g. `['ADMIN']`. */
  readonly roles = computed(() => Object.keys(this.#roles()));

  /** Every permission the user has: direct ones and those granted by the roles. */
  readonly permissions = computed(() => [
    ...new Set([...this.#direct(), ...Object.values(this.#roles()).flat()]),
  ]);

  /** Roles and permissions together: the names `only` and `except` are matched against. */
  readonly granted = computed(() => new Set([...this.roles(), ...this.permissions()]));

  /** Replaces the roles, each with the permissions it grants: `{ ADMIN: ['canAdd', …] }`. */
  setRoles(roles: Readonly<Record<string, readonly string[]>>): void {
    this.#roles.set({ ...roles });
  }

  /** Grants permissions directly (independently of the roles). */
  addPermissions(...permissions: string[]): void {
    this.#direct.update(current => [...new Set([...current, ...permissions])]);
  }

  /** Revokes directly granted permissions (role permissions stay). */
  removePermissions(...permissions: string[]): void {
    this.#direct.update(current => current.filter(name => !permissions.includes(name)));
  }

  /** Forgets all roles and permissions (sign-out). */
  clear(): void {
    this.#roles.set({});
    this.#direct.set([]);
  }

  /** Whether the user passes `rule`; reactive when called from a template or `computed()`. */
  has(rule: PermissionRule | undefined): boolean {
    const granted = this.granted();
    const except = toArray(rule?.except);
    const only = toArray(rule?.only);
    if (except.some(name => granted.has(name))) {
      return false;
    }
    return only.length === 0 || only.some(name => granted.has(name));
  }
}

function toArray(names: string | readonly string[] | undefined): readonly string[] {
  if (names === undefined) {
    return [];
  }
  return typeof names === 'string' ? [names] : names;
}
