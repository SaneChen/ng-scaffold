/**
 * Unit tests for `PermissionsRoleSwitching`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/role-switching` generated the "should create" test.
 *   2. Replaced it with a test that the page explains the demo and hosts the role switcher.
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { PermissionsRoleSwitching } from './role-switching';

describe('PermissionsRoleSwitching', () => {
  it('should explain the demo and offer the role switcher', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
      ],
    });
    const fixture = TestBed.createComponent(PermissionsRoleSwitching);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('p')?.textContent).toBe('demo.permissions.switching.intro');
    expect(host.querySelectorAll('app-role-switcher mat-button-toggle')).toHaveLength(3);
  });
});
