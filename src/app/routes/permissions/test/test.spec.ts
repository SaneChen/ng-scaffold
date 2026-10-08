/**
 * Unit tests for `PermissionsTest`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/permissions/test` generated the "should create" test.
 *   2. Replaced it with a test that granting and revoking `canPublish` switches each `*appCan`
 *      example between its template and the `else` template (as ADMIN).
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PermissionStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { PermissionsTest } from './test';

describe('PermissionsTest', () => {
  let fixture: ComponentFixture<PermissionsTest>;

  /** Per example: the class of what it renders (`shown`, `denied`) or `-` for nothing. */
  function results(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.examples li')).map(
      li => li.querySelector('p')?.className ?? '-'
    );
  }

  function button(index: number): HTMLButtonElement {
    return fixture.nativeElement.querySelectorAll('.actions button')[index];
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
      ],
    });
    TestBed.inject(PermissionStore).setRoles({ ADMIN: ['canRead'] });
    fixture = TestBed.createComponent(PermissionsTest);
    await fixture.whenStable();
  });

  it('should evaluate the examples before and after granting canPublish', async () => {
    expect(results()).toEqual(['-', 'denied', 'shown', 'shown', 'denied']);

    button(0).click();
    await fixture.whenStable();
    expect(results()).toEqual(['shown', 'shown', '-', 'denied', 'denied']);
    expect(button(0).getAttribute('aria-disabled')).toBe('true');

    button(1).click();
    await fixture.whenStable();
    expect(results()).toEqual(['-', 'denied', 'shown', 'shown', 'denied']);
  });
});
