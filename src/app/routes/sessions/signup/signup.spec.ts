/**
 * Unit tests for `Signup`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/signup` generated the "should create" test.
 *   2. Replaced it with tests through the rendered form with a stubbed `AuthStore.register()`:
 *      the validation rules (required, email, length, matching confirmation, accepted terms),
 *      focus on the terms checkbox, a successful registration, a taken username reported by the
 *      server and a retry right after a network error.
 */
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { Signup } from './signup';

@Component({ template: '' })
class Page {}

describe('Signup', () => {
  let harness: RouterTestingHarness;
  let host: HTMLElement;
  const register = vi.fn<AuthStore['register']>();

  function fields(): HTMLInputElement[] {
    return Array.from(host.querySelectorAll('input[matInput]'));
  }

  async function fill(...values: string[]): Promise<void> {
    fields().forEach((field, i) => {
      field.value = values[i] ?? '';
      field.dispatchEvent(new Event('input'));
    });
    await harness.fixture.whenStable();
  }

  async function agree(): Promise<void> {
    host.querySelector<HTMLInputElement>('mat-checkbox input')?.click();
    await harness.fixture.whenStable();
  }

  async function submit(): Promise<void> {
    host.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await harness.fixture.whenStable();
  }

  function errors(): string[] {
    return Array.from(host.querySelectorAll('mat-error, .field-error, .form-errors p'))
      .map(error => error.textContent?.trim() ?? '')
      .filter(Boolean);
  }

  beforeEach(async () => {
    register.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'auth/signup', component: Signup },
          { path: '**', component: Page },
        ]),
        provideTranslateService(),
        { provide: AuthStore, useValue: { register } },
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/auth/signup', Signup);
    host = harness.routeNativeElement as HTMLElement;
  });

  it('should name every field for autofill', () => {
    expect(fields().map(field => field.autocomplete)).toEqual([
      'username',
      'email',
      'new-password',
      'new-password',
    ]);
  });

  it('should validate the fields and the terms before registering', async () => {
    await submit();
    expect(errors()).toEqual([
      'validation.required',
      'validation.required',
      'validation.required',
      'validation.agree_terms',
    ]);
    expect(document.activeElement).toBe(fields()[0]);

    await fill('bob', 'not-an-email', 'abc', 'abd');
    await submit();
    expect(errors()).toEqual([
      'validation.invalid_email',
      'validation.min_length',
      'validation.password_mismatch',
      'validation.agree_terms',
    ]);
    expect(register).not.toHaveBeenCalled();
  });

  it('should focus the terms checkbox when it is the only invalid field', async () => {
    await fill('bob', '', 'secret1', 'secret1');
    await submit();

    expect(errors()).toEqual(['validation.agree_terms']);
    expect(document.activeElement).toBe(host.querySelector('mat-checkbox input'));
  });

  it('should register and open the home page', async () => {
    await fill('bob', '', 'secret1', 'secret1');
    await agree();
    await submit();

    expect(register).toHaveBeenCalledWith({ username: 'bob', password: 'secret1' });
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should show a username taken on the server', async () => {
    register.mockRejectedValueOnce(
      new HttpErrorResponse({
        status: 422,
        error: { errors: { username: ['The username has already been taken.'] } },
      })
    );
    await fill('bob', 'bob@example.com', 'secret1', 'secret1');
    await agree();
    await submit();

    expect(errors()).toEqual(['The username has already been taken.']);
    expect(TestBed.inject(Router).url).toBe('/auth/signup');
  });

  it('should allow a retry right after a network error', async () => {
    register.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));
    await fill('bob', '', 'secret1', 'secret1');
    await agree();
    await submit();
    expect(errors()).toEqual(['http.network_error']);

    await submit();
    expect(register).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
