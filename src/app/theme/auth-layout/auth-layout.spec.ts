/**
 * Unit tests for `AuthLayout`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/auth-layout` generated the "should create" test.
 *   2. Replaced it with a check that the routed page renders inside the `<main>` landmark, next
 *      to the language menu.
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthLayout } from './auth-layout';

@Component({ template: '<h1>Sign in</h1>' })
class Login {}

describe('AuthLayout', () => {
  it('should render the routed page inside the main landmark with the language menu', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideRouter([
          { path: 'auth', component: AuthLayout, children: [{ path: 'login', component: Login }] },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/auth/login');
    const element: HTMLElement = harness.fixture.nativeElement;

    expect(element.querySelector('main h1')?.textContent).toBe('Sign in');
    expect(element.querySelector('app-translate-button')).not.toBeNull();
  });
});
