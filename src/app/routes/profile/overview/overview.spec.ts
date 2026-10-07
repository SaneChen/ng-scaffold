/**
 * Unit tests for `ProfileOverview`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/profile/overview` generated the "should create" test.
 *   2. Replaced it with a test of the account details read from the stores.
 */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore, PermissionStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { ProfileOverview } from './overview';

describe('ProfileOverview', () => {
  it('should list the name, email, roles and permissions', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        {
          provide: AuthStore,
          useValue: { user: signal({ name: 'Ada', email: 'ada@example.com' }) },
        },
        {
          provide: PermissionStore,
          useValue: { roles: signal(['ADMIN']), permissions: signal(['canAdd', 'canEdit']) },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProfileOverview);
    await fixture.whenStable();

    const values = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('dd')).map(dd =>
      dd.textContent?.trim()
    );
    expect(values).toEqual(['Ada', 'ada@example.com', 'ADMIN', 'canAdd, canEdit']);
  });
});
