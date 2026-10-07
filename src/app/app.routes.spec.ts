/**
 * Unit tests for the route table of `app.routes.ts`.
 *
 * How this file was built: written by hand (`ng new` generates no spec for the routes).
 *
 * Why: the order of the top-level routes matters. The admin layout's empty path matches every
 * URL and its `authGuard` redirects signed-out users to the login page, so the auth layout must
 * be matched first or the login page redirects to itself without end.
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { routes } from './app.routes';

describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        provideTranslateService(),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('should show the login page to signed-out users', async () => {
    await harness.navigateByUrl('/auth');

    expect(TestBed.inject(Router).url).toBe('/auth/login');
    expect(harness.routeNativeElement?.querySelector('app-login')).not.toBeNull();
  });

  it('should send signed-out users from the admin area to the login page', async () => {
    await harness.navigateByUrl('/403');

    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2F403');
  });
});
