/**
 * Unit tests for `permissionGuard`.
 *
 * How this file was built:
 *   1. `yarn ng g guard core/permissions/permission --implements CanMatch` generated the "should
 *      be created" test with `executeGuard`.
 *   2. Replaced it with navigations through a real router, the guard used as `canMatch` and as
 *      `canActivate`, with and without `redirectTo`.
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { permissionGuard, RoutePermissions } from './permission-guard';
import { PermissionStore } from './permission-store';

@Component({ template: '' })
class Page {}

describe('permissionGuard', () => {
  let harness: RouterTestingHarness;
  let store: PermissionStore;

  beforeEach(async () => {
    const adminsOnly: RoutePermissions = { only: 'ADMIN' };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '403', component: Page },
          { path: 'dashboard', component: Page },
          {
            path: 'admin',
            component: Page,
            canMatch: [permissionGuard],
            data: { permissions: adminsOnly },
          },
          {
            path: 'reports',
            component: Page,
            canActivate: [permissionGuard],
            data: { permissions: { except: 'GUEST', redirectTo: '/dashboard' } },
          },
        ]),
      ],
    });
    store = TestBed.inject(PermissionStore);
    harness = await RouterTestingHarness.create();
  });

  it('should let users in who pass the rule', async () => {
    store.setRoles({ ADMIN: [] });

    await harness.navigateByUrl('/admin');
    expect(TestBed.inject(Router).url).toBe('/admin');
    await harness.navigateByUrl('/reports');
    expect(TestBed.inject(Router).url).toBe('/reports');
  });

  it('should redirect to /403 by default and to redirectTo when given', async () => {
    store.setRoles({ GUEST: [] });

    await harness.navigateByUrl('/admin');
    expect(TestBed.inject(Router).url).toBe('/403');
    await harness.navigateByUrl('/reports');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
