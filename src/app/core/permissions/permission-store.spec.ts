/**
 * Unit tests for `PermissionStore`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/permissions/permission-store` generated the "should be created"
 *      test.
 *   2. Replaced it with tests for the ngx-permissions semantics (roles and permissions both
 *      match, `except` wins, empty `only` allows), direct permissions, clearing and the
 *      reactivity of `has()` inside a `computed()`.
 *   3. Added that a signed-in user's roles grant the permissions of `ROLE_PERMISSIONS` (unknown
 *      roles none) and their own permissions are added.
 */
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../auth/auth-store';
import { User } from '../auth/user';
import { PermissionStore, ROLE_PERMISSIONS } from './permission-store';

describe('PermissionStore', () => {
  let store: PermissionStore;

  beforeEach(() => {
    store = TestBed.inject(PermissionStore);
    store.setRoles({ ADMIN: ['canAdd', 'canRead'], AUDITOR: ['canRead'] });
  });

  it('should expose roles and the union of their permissions', () => {
    expect(store.roles()).toEqual(['ADMIN', 'AUDITOR']);
    expect(store.permissions()).toEqual(['canAdd', 'canRead']);
  });

  it('should match `only` against roles and permissions', () => {
    expect(store.has({ only: 'ADMIN' })).toBe(true);
    expect(store.has({ only: ['canDelete', 'canAdd'] })).toBe(true);
    expect(store.has({ only: 'GUEST' })).toBe(false);
  });

  it('should deny any `except` match, even when `only` matches', () => {
    expect(store.has({ except: 'GUEST' })).toBe(true);
    expect(store.has({ only: 'ADMIN', except: 'canRead' })).toBe(false);
  });

  it('should allow an empty or missing rule', () => {
    expect(store.has(undefined)).toBe(true);
    expect(store.has({ only: [] })).toBe(true);
  });

  it('should add and remove direct permissions without touching role permissions', () => {
    store.addPermissions('export', 'canRead');
    expect(store.has({ only: 'export' })).toBe(true);

    store.removePermissions('export', 'canRead');
    expect(store.has({ only: 'export' })).toBe(false);
    expect(store.has({ only: 'canRead' })).toBe(true);
  });

  it('should derive the roles and permissions of the signed-in user', () => {
    const user = signal<User | null>({
      id: 1,
      name: 'Ada',
      email: 'ada@example.com',
      roles: ['EDITOR', 'UNKNOWN'],
      permissions: ['export'],
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { user } },
        { provide: ROLE_PERMISSIONS, useValue: { EDITOR: ['canEdit'] } },
      ],
    });
    store = TestBed.inject(PermissionStore);

    expect(store.roles()).toEqual(['EDITOR', 'UNKNOWN']);
    expect(store.permissions()).toEqual(['export', 'canEdit']);

    user.set(null);
    expect(store.granted().size).toBe(0);
  });

  it('should be reactive and forget everything on clear()', () => {
    const canAdd = computed(() => store.has({ only: 'canAdd' }));
    expect(canAdd()).toBe(true);

    store.clear();

    expect(canAdd()).toBe(false);
    expect(store.roles()).toEqual([]);
  });
});
