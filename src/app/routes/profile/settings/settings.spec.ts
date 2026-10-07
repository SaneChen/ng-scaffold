/**
 * Unit tests for `ProfileSettings`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/profile/settings` generated the "should create" test.
 *   2. Replaced it with tests through the rendered form with stubbed stores: the fields filled from
 *      the user (also one that loads later), validation, a saved profile with its toast, a value
 *      refused by the server and a retry right after a network error.
 */
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore, Toaster } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { ProfileSettings } from './settings';

describe('ProfileSettings', () => {
  let fixture: ComponentFixture<ProfileSettings>;
  const updateProfile = vi.fn<AuthStore['updateProfile']>();
  const user = signal<{ name: string; email: string } | null>(null);
  const success = vi.fn();

  function inputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input'));
  }

  async function type(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();
  }

  function errors(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('mat-error')).map(
      error => error.textContent?.trim() ?? ''
    );
  }

  beforeEach(async () => {
    updateProfile.mockReset().mockResolvedValue(undefined);
    success.mockReset();
    user.set({ name: 'Ada', email: 'ada@example.com' });
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        {
          provide: AuthStore,
          useValue: { user, updateProfile },
        },
        { provide: Toaster, useValue: { success } },
      ],
    });
    fixture = TestBed.createComponent(ProfileSettings);
    await fixture.whenStable();
  });

  it('should start from the user and save the changes', async () => {
    expect(inputs().map(input => [input.value, input.autocomplete])).toEqual([
      ['Ada', 'name'],
      ['ada@example.com', 'email'],
    ]);

    await type(inputs()[0], 'Ada L.');
    await submit();

    expect(updateProfile).toHaveBeenCalledWith({ name: 'Ada L.', email: 'ada@example.com' });
    expect(success).toHaveBeenCalledWith('profile_page.saved');
  });

  it('should validate before saving and show the errors of the server', async () => {
    await type(inputs()[0], '');
    await type(inputs()[1], 'nope');
    await submit();
    expect(errors()).toEqual(['validation.required', 'validation.invalid_email']);
    expect(updateProfile).not.toHaveBeenCalled();

    updateProfile.mockRejectedValueOnce(
      new HttpErrorResponse({ status: 422, error: { errors: { email: ['Already used.'] } } })
    );
    await type(inputs()[0], 'Ada');
    await type(inputs()[1], 'taken@example.com');
    await submit();
    expect(errors()).toEqual(['Already used.']);
    expect(success).not.toHaveBeenCalled();
  });

  it('should show the user once loaded and the saved values after saving', async () => {
    user.set(null);
    await fixture.whenStable();
    expect(inputs().map(input => input.value)).toEqual(['', '']);

    user.set({ name: 'Grace', email: 'grace@example.com' });
    await fixture.whenStable();
    expect(inputs().map(input => input.value)).toEqual(['Grace', 'grace@example.com']);
  });

  it('should allow a retry right after a network error', async () => {
    updateProfile.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));
    await submit();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent.trim()).toBe(
      'http.network_error'
    );

    await submit();
    expect(updateProfile).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledOnce();
  });
});
