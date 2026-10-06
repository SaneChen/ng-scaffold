/**
 * Unit tests for `authGuard`.
 *
 * How this file was built:
 *   1. `yarn ng g guard core/auth/auth --implements CanMatch` generated the "should be created"
 *      test with `executeGuard`.
 *   2. Replaced it with navigations through a real router (the guard reads the URL of the current
 *      navigation): signed in, signed out with a deep link (`returnUrl`), signed out at the root,
 *      and the `canActivateChild` re-check after the token was dropped.
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from './auth-guard';
import { TokenStore } from './token-store';

@Component({ template: '' })
class Page {}

describe('authGuard', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'auth/login', component: Page },
          {
            path: '',
            canMatch: [authGuard],
            canActivateChild: [authGuard],
            children: [
              { path: '', component: Page },
              { path: 'reports/:id', component: Page },
            ],
          },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => sessionStorage.clear());

  it('should let a signed-in user in', async () => {
    TestBed.inject(TokenStore).set({ access_token: 'abc' }, false);

    await harness.navigateByUrl('/reports/7?view=chart');

    expect(TestBed.inject(Router).url).toBe('/reports/7?view=chart');
  });

  it('should redirect a signed-out user to the login page with the requested URL', async () => {
    await harness.navigateByUrl('/reports/7?view=chart');

    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Freports%2F7%3Fview%3Dchart');
  });

  it('should not add a returnUrl for the root page', async () => {
    await harness.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/auth/login');
  });

  it('should re-check child navigations after the token was dropped', async () => {
    const tokens = TestBed.inject(TokenStore);
    tokens.set({ access_token: 'abc' }, false);
    await harness.navigateByUrl('/');
    tokens.clear();

    await harness.navigateByUrl('/reports/1');

    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Freports%2F1');
  });
});
