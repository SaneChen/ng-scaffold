/**
 * Unit tests for `ProfileLayout`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/profile/layout` generated the "should create" test.
 *   2. Replaced it with tests through the profile routes: the user's card (default avatar), the
 *      active link and the logout button.
 */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthStore, User } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import routes from '../profile.routes';

describe('ProfileLayout', () => {
  const logout = vi.fn();
  const user = signal<User | null>({ id: 1, name: 'Ada', email: 'ada@example.com', roles: [] });

  afterEach(() => logout.mockClear());

  async function show(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'profile', children: routes }]),
        provideTranslateService(),
        { provide: AuthStore, useValue: { user, logout } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return harness.fixture.nativeElement;
  }

  it('should show the user and mark the current page', async () => {
    const host = await show('/profile');

    expect(host.querySelector('.user h2')?.textContent).toBe('Ada');
    expect(host.querySelector('.user img')?.getAttribute('src')).toBe('images/avatar-default.svg');
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(
      '/profile/overview'
    );
  });

  it('should log out with a button', async () => {
    const host = await show('/profile/settings');
    const button = Array.from(host.querySelectorAll('button')).find(b =>
      b.textContent?.includes('logout')
    );

    button?.click();

    expect(logout).toHaveBeenCalled();
  });
});
