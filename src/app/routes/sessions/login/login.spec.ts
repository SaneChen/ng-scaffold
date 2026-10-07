/**
 * Unit tests for `Login`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/login` generated the "should create" test.
 *   2. Replaced it with tests through the rendered form with a stubbed `AuthStore.login()`:
 *      `autocomplete` tokens, required errors with focus on the first invalid field, "remember
 *      me" and the redirect to `returnUrl`, a refused login and a network error in the alert
 *      region, each followed by an immediate retry.
 */
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { Login } from './login';

@Component({ template: '' })
class Page {}

describe('Login', () => {
  let harness: RouterTestingHarness;
  let host: HTMLElement;
  const login = vi.fn<AuthStore['login']>();

  function input(autocomplete: string): HTMLInputElement {
    return host.querySelector(`input[autocomplete="${autocomplete}"]`) as HTMLInputElement;
  }

  async function type(field: HTMLInputElement, value: string): Promise<void> {
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
  }

  async function submit(): Promise<void> {
    host.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await harness.fixture.whenStable();
  }

  function errors(): string[] {
    return Array.from(host.querySelectorAll('mat-error, .form-errors p')).map(
      error => error.textContent?.trim() ?? ''
    );
  }

  beforeEach(async () => {
    login.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'auth/login', component: Login },
          { path: '**', component: Page },
        ]),
        provideTranslateService(),
        { provide: AuthStore, useValue: { login } },
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/auth/login?returnUrl=%2Fprofile%3Ftab%3D1', Login);
    host = harness.routeNativeElement as HTMLElement;
  });

  it('should require both fields and focus the first invalid one', async () => {
    await type(input('username'), '');
    await type(input('current-password'), '');
    await submit();

    expect(login).not.toHaveBeenCalled();
    expect(errors()).toEqual(['validation.required', 'validation.required']);
    expect(document.activeElement).toBe(input('username'));
  });

  it('should sign in, remembered on request, and return to the requested page', async () => {
    await type(input('username'), 'alice');
    await type(input('current-password'), 'secret');
    host.querySelector<HTMLInputElement>('mat-checkbox input')?.click();
    await submit();

    expect(login).toHaveBeenCalledWith('alice', 'secret', true);
    expect(TestBed.inject(Router).url).toBe('/profile?tab=1');
  });

  it('should show why a login was refused and allow a retry at once', async () => {
    await type(input('username'), 'alice');
    await type(input('current-password'), 'wrong');
    login.mockRejectedValueOnce(
      new HttpErrorResponse({
        status: 422,
        error: { message: 'Invalid.', errors: { password: ['Wrong password.'] } },
      })
    );
    await submit();
    expect(errors()).toEqual(['Wrong password.']);

    login.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));
    await submit();
    expect(login).toHaveBeenCalledTimes(2);
    expect(errors()).toEqual(['http.network_error']);
    expect(host.querySelector('[role="alert"]')?.textContent?.trim()).toBe('http.network_error');

    await submit();
    expect(login).toHaveBeenCalledTimes(3);
    expect(TestBed.inject(Router).url).toBe('/profile?tab=1');
  });
});
