/**
 * Unit tests for `UserPanel`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/user-panel` generated the "should create" test.
 *   2. Replaced it with a check of the profile link (a real link, unlike ng-matero's `<div>`), the
 *      user's details and the default avatar, with a stubbed `AuthStore`.
 */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore, User } from '@core';
import { DEFAULT_AVATAR } from '../widgets/user-button/user-button';
import { UserPanel } from './user-panel';

describe('UserPanel', () => {
  it('should link to the profile with the user name, email and avatar', async () => {
    const user = signal<User | null>({ id: 1, name: 'Ada', email: 'ada@example.com', roles: [] });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: { user } }],
    });
    const fixture = TestBed.createComponent(UserPanel);
    await fixture.whenStable();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.getAttribute('href')).toBe('/profile/overview');
    expect(link.querySelector('.name')?.textContent).toBe('Ada');
    expect(link.querySelector('.email')?.textContent).toBe('ada@example.com');
    expect(link.querySelector('img')?.getAttribute('src')).toBe(DEFAULT_AVATAR);
  });
});
