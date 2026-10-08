/**
 * Unit tests for `RoleSwitcher`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/role-switcher` generated the "should create" test.
 *   2. Replaced it with tests of the toggles (one per role of `ROLE_PERMISSIONS`, the current one
 *      checked) and of a switch (store updated, roles and permissions shown, `switched` emitted).
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { RoleSwitcher } from './role-switcher';

describe('RoleSwitcher', () => {
  let fixture: ComponentFixture<RoleSwitcher>;

  function toggles(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('mat-button-toggle button'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateService()],
    });
    TestBed.inject(PermissionStore).setRoles({ ADMIN: ['canRead'] });
    fixture = TestBed.createComponent(RoleSwitcher);
    await fixture.whenStable();
  });

  it('should offer every role with the current one checked', () => {
    expect(toggles().map(toggle => toggle.textContent?.trim())).toEqual([
      'ADMIN',
      'MANAGER',
      'GUEST',
    ]);
    expect(toggles().map(toggle => toggle.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('should switch the role, show its permissions and tell the page', async () => {
    const switched = vi.fn();
    fixture.componentInstance.switched.subscribe(switched);

    toggles()[1].click();
    await fixture.whenStable();

    expect(TestBed.inject(PermissionStore).roles()).toEqual(['MANAGER']);
    expect(switched).toHaveBeenCalledWith('MANAGER');
    const values = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('dd')).map(dd =>
      Array.from(dd.querySelectorAll('code'), code => code.textContent)
    );
    expect(values).toEqual([['MANAGER'], ['canAdd', 'canEdit', 'canRead']]);
  });
});
