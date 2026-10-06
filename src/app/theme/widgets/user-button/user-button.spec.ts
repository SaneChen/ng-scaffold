/**
 * Unit tests for `UserButton`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/user-button --inline-template --inline-style` generated
 *      the "should create" test.
 *   2. Replaced it with tests with a stubbed `AuthStore`: the default avatar, the menu's router
 *      links, restoring the default settings and logging out.
 */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore, SettingsStore, User } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { DEFAULT_AVATAR, UserButton } from './user-button';

describe('UserButton', () => {
  let fixture: ComponentFixture<UserButton>;
  const user = signal<User | null>({ id: 1, name: 'Ada', email: 'ada@example.com', roles: [] });
  const logout = vi.fn().mockResolvedValue(undefined);

  async function openMenu(): Promise<HTMLElement[]> {
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    return Array.from(document.querySelectorAll<HTMLElement>('[mat-menu-item]'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuthStore, useValue: { user, logout } },
      ],
    });
    fixture = TestBed.createComponent(UserButton);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should show the default avatar for a user without one', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    expect(img.getAttribute('src')).toBe(DEFAULT_AVATAR);
    expect(img.getAttribute('alt')).toBe('');
  });

  it('should link to the profile pages', async () => {
    const [profile, settings] = await openMenu();

    expect(profile.getAttribute('href')).toBe('/profile/overview');
    expect(settings.getAttribute('href')).toBe('/profile/settings');
  });

  it('should restore the default settings and log out', async () => {
    const store = TestBed.inject(SettingsStore);
    store.update({ dir: 'rtl' });
    const items = await openMenu();

    items[2].click();
    expect(store.options().dir).toBe('ltr');

    (await openMenu())[3].click();
    expect(logout).toHaveBeenCalled();
  });

  it('should not name the menu after an empty user name while the user loads', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('header.account');

    user.set(null);
    await fixture.whenStable();

    expect(button.getAttribute('aria-label')).toBe('header.account_anonymous');
    user.set({ id: 1, name: 'Ada', email: 'ada@example.com', roles: [] });
  });
});
