/**
 * Unit tests for the route table of `app.routes.ts`.
 *
 * How this file was built: written by hand (`ng new` generates no spec for the routes).
 *
 * Later steps added the default redirect to the dashboard and the 404 page for unknown URLs.
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
import { TokenStore } from '@core';
import { routes } from './app.routes';
import { CHARTS_LOADER } from './routes/dashboard/dashboard';

describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeAll(() => {
    // jsdom has no scrolling; the admin layout scrolls its content to the top after navigations.
    Element.prototype.scrollTo ??= () => undefined;
  });

  afterEach(() => sessionStorage.clear());

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        provideTranslateService(),
        // jsdom has no canvas: the dashboard's charts never load here.
        { provide: CHARTS_LOADER, useValue: () => new Promise(() => undefined) },
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

  it('should open the dashboard at the root and the 404 page for unknown URLs', async () => {
    TestBed.inject(TokenStore).set({ access_token: 'token' }, false);
    const router = TestBed.inject(Router);

    await harness.navigateByUrl('/');
    expect(router.url).toBe('/dashboard');

    await harness.navigateByUrl('/no/such/page');
    expect(router.url).toBe('/no/such/page');
    expect(harness.routeNativeElement?.querySelector('app-error-404')).not.toBeNull();
  });
});
