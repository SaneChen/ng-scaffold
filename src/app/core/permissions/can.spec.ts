/**
 * Unit tests for the `*appCan` directive.
 *
 * How this file was built:
 *   1. `yarn ng g directive core/permissions/can` generated a test that called `new Can()`, which
 *      cannot work for a directive that injects its template.
 *   2. Replaced it with a host component using the microsyntax (`only` name, `except`, `else`
 *      template, rule object) and checks that the DOM follows role changes, and that a view
 *      is not recreated when the decision stays the same.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Can } from './can';
import { PermissionStore } from './permission-store';

@Component({
  imports: [Can],
  template: `
    <p *appCan="'ADMIN'; else denied">admin</p>
    <ng-template #denied><p>denied</p></ng-template>
    <p *appCan="['canRead']; except: 'GUEST'">reader</p>
    <p *appCan="{ except: 'ADMIN' }">not admin</p>
  `,
})
class Host {}

describe('Can', () => {
  let fixture: ComponentFixture<Host>;
  let store: PermissionStore;

  function texts(): string[] {
    fixture.detectChanges();
    return Array.from(fixture.nativeElement.querySelectorAll('p'), (p: Element) =>
      p.textContent?.trim()
    );
  }

  beforeEach(() => {
    store = TestBed.inject(PermissionStore);
    fixture = TestBed.createComponent(Host);
  });

  it('should render templates by role and update when the roles change', () => {
    store.setRoles({ ADMIN: ['canRead'] });
    expect(texts()).toEqual(['admin', 'reader']);

    store.setRoles({ GUEST: ['canRead'] });
    expect(texts()).toEqual(['denied', 'not admin']);

    store.setRoles({ MANAGER: ['canRead'] });
    expect(texts()).toEqual(['denied', 'reader', 'not admin']);
  });

  it('should keep the rendered view when a role change does not change the decision', () => {
    store.setRoles({ ADMIN: ['canRead'] });
    texts();
    const admin = fixture.nativeElement.querySelector('p');

    store.setRoles({ ADMIN: ['canRead', 'canEdit'] });
    texts();

    expect(fixture.nativeElement.querySelector('p')).toBe(admin);
  });
});
