/**
 * Unit tests for `Preloader`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/preloader/preloader` generated the "should be created" test.
 *   2. Added tests that create a `#globalLoader` element like the one in src/index.html and check
 *      the fade-out, the removal on `transitionend`, the timeout fallback and repeated calls
 *      (fake timers, `hide()` block).
 *   3. Added tests for `hideAfterFirstNavigation()` with the real router and
 *      `RouterTestingHarness`. Lazy routes resolve only when a test says so, and
 *      `ApplicationRef.tick()` renders while a page chunk is still "downloading", which proves
 *      that a render alone does not hide the loader: it stays until the first page (also after a
 *      guard redirect) has rendered, and goes away when the navigation fails.
 */
import { ApplicationRef, Component, inject, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationCancel, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { Preloader, PRELOADER_ID } from './preloader';

@Component({ selector: 'app-dashboard-page', template: '<h1>Dashboard</h1>' })
class DashboardPage {}

@Component({ selector: 'app-login-page', template: '<h1>Sign in</h1>' })
class LoginPage {}

/** A lazy page whose chunk keeps "downloading" until `resolve()` is called. */
function deferredPage(component: Type<unknown>) {
  let resolve: () => void = () => undefined;
  const chunk = new Promise<Type<unknown>>(done => (resolve = () => done(component)));
  return { load: () => chunk, resolve: () => resolve() };
}

describe('Preloader', () => {
  let service: Preloader;
  let loader: HTMLElement;

  beforeEach(() => {
    loader = document.createElement('div');
    loader.id = PRELOADER_ID;
    loader.className = 'global-loader';
    document.body.append(loader);
  });

  afterEach(() => {
    loader.remove();
  });

  describe('hide()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      TestBed.configureTestingModule({});
      service = TestBed.inject(Preloader);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start the fade-out and remove the loader when the transition ends', () => {
      service.hide();
      expect(loader.classList).toContain('global-loader-fade-out');
      expect(loader.isConnected).toBe(true);

      loader.dispatchEvent(new Event('transitionend'));
      expect(loader.isConnected).toBe(false);
    });

    it('should remove the loader after a timeout when no transition runs', () => {
      service.hide();
      vi.advanceTimersByTime(500);

      expect(loader.isConnected).toBe(false);
    });

    it('should tolerate repeated calls and a missing loader', () => {
      service.hide();
      expect(() => service.hide()).not.toThrow();

      vi.runAllTimers();
      expect(document.getElementById(PRELOADER_ID)).toBeNull();
      expect(() => service.hide()).not.toThrow();
    });
  });

  describe('hideAfterFirstNavigation()', () => {
    let dashboard: ReturnType<typeof deferredPage>;
    let login: ReturnType<typeof deferredPage>;

    beforeEach(() => {
      dashboard = deferredPage(DashboardPage);
      login = deferredPage(LoginPage);
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            { path: 'dashboard', title: 'Dashboard', loadComponent: dashboard.load },
            { path: 'login', loadComponent: login.load },
            {
              path: 'private',
              canActivate: [() => inject(Router).parseUrl('/login')],
              component: DashboardPage,
            },
            { path: 'broken', loadComponent: () => Promise.reject(new Error('chunk failed')) },
          ]),
        ],
      });
      service = TestBed.inject(Preloader);
    });

    /** Renders the application synchronously, running `afterNextRender` callbacks. */
    function render(): void {
      TestBed.inject(ApplicationRef).tick();
    }

    it('should keep the loader until the first lazy page has rendered', async () => {
      const harness = await RouterTestingHarness.create();
      service.hideAfterFirstNavigation();

      const navigated = harness.navigateByUrl('/dashboard');
      render();
      expect(loader.classList).not.toContain('global-loader-fade-out');

      dashboard.resolve();
      await navigated;
      await harness.fixture.whenStable();
      expect(harness.routeNativeElement?.textContent).toBe('Dashboard');
      expect(loader.classList).toContain('global-loader-fade-out');
    });

    it('should wait for the page that a guard redirects to', async () => {
      const harness = await RouterTestingHarness.create();
      const router = TestBed.inject(Router);
      const redirected = firstValueFrom(
        router.events.pipe(filter(event => event instanceof NavigationCancel))
      );
      service.hideAfterFirstNavigation();

      const navigated = harness.navigateByUrl('/private');
      await redirected;
      render();
      expect(loader.classList).not.toContain('global-loader-fade-out');

      login.resolve();
      await navigated;
      await harness.fixture.whenStable();
      expect(router.url).toBe('/login');
      expect(harness.routeNativeElement?.textContent).toBe('Sign in');
      expect(loader.classList).toContain('global-loader-fade-out');
    });

    it('should not leave the loader up when the first navigation fails', async () => {
      const harness = await RouterTestingHarness.create();
      service.hideAfterFirstNavigation();

      await expect(harness.navigateByUrl('/broken')).rejects.toThrow('chunk failed');
      await harness.fixture.whenStable();
      expect(loader.classList).toContain('global-loader-fade-out');
    });

    it('should hide after the next render when the first navigation has already settled', async () => {
      dashboard.resolve();
      const harness = await RouterTestingHarness.create('/dashboard');

      service.hideAfterFirstNavigation();
      expect(loader.classList).not.toContain('global-loader-fade-out');

      await harness.fixture.whenStable();
      expect(loader.classList).toContain('global-loader-fade-out');
    });
  });
});
