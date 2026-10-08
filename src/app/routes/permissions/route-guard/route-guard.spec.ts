/**
 * Unit tests for `PermissionsRouteGuard` with the routes of permissions.routes.ts.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/route-guard` generated the "should create" test.
 *   2. Replaced it with navigations through the real permission routes: GUEST cannot open the
 *      page, and switching to GUEST on the page sends the user to the dashboard while another
 *      role keeps the page.
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PermissionStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import routes from '../permissions.routes';

@Component({ template: 'dashboard' })
class Dashboard {}

describe('PermissionsRouteGuard', () => {
  let harness: RouterTestingHarness;

  function toggle(role: string): HTMLButtonElement {
    return Array.from<HTMLButtonElement>(
      harness.routeNativeElement?.querySelectorAll('mat-button-toggle button') ?? []
    ).find(button => button.textContent?.trim() === role) as HTMLButtonElement;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        provideRouter([
          // The pages and their guards, without the demo translations of the parent route.
          { path: 'permissions', children: routes[0].children },
          { path: 'dashboard', component: Dashboard },
        ]),
      ],
    });
    TestBed.inject(PermissionStore).setRoles({ ADMIN: [] });
    harness = await RouterTestingHarness.create();
  });

  it('should keep GUEST out of the page', async () => {
    TestBed.inject(PermissionStore).setRoles({ GUEST: [] });

    await harness.navigateByUrl('/permissions/route-guard');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('should check the page again after a switch', async () => {
    await harness.navigateByUrl('/permissions/route-guard');

    toggle('MANAGER').click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/permissions/route-guard');

    toggle('GUEST').click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
