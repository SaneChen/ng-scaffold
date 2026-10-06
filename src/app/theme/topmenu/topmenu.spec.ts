/**
 * Unit tests for `Topmenu` and its `TopmenuPanel` dropdowns.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/topmenu` generated the "should create" test (the panel spec is
 *      covered here, through the menu that uses it).
 *   2. Replaced it with tests against a real router and `MenuStore`: the named landmark, the
 *      current page link, the group containing the current page highlighted, and nested
 *      dropdowns with their router links.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Menu, MenuStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { Topmenu } from './topmenu';

@Component({ template: '' })
class Page {}

const MENU: Menu[] = [
  { route: 'dashboard', name: 'dashboard', type: 'link', icon: 'dashboard' },
  {
    route: 'material',
    name: 'material',
    type: 'sub',
    icon: 'favorite',
    children: [
      {
        route: 'buttons',
        name: 'buttons',
        type: 'sub',
        children: [{ route: 'button', name: 'button', type: 'link' }],
      },
      { route: 'card', name: 'card', type: 'link' },
    ],
  },
];

describe('Topmenu', () => {
  let fixture: ComponentFixture<Topmenu>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Page }]), provideTranslateService()],
    });
    TestBed.inject(MenuStore).set(MENU);
    await RouterTestingHarness.create('/material/buttons/button');
    fixture = TestBed.createComponent(Topmenu);
    await fixture.whenStable();
  });

  it('should render a named navigation with the groups of the current page highlighted', () => {
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    const [dashboard, material] = Array.from<HTMLElement>(nav.querySelectorAll('a, button'));

    expect(nav.getAttribute('aria-label')).toBe('sidebar.navigation');
    expect(dashboard.getAttribute('href')).toBe('/dashboard');
    expect(dashboard.hasAttribute('aria-current')).toBe(false);
    expect(material.classList).toContain('active');
    expect(material.getAttribute('aria-haspopup')).toBe('menu');
    // Icons are direct children, so Material's button places them in its icon slots.
    expect(dashboard.querySelector(':scope > mat-icon')?.textContent).toBe('dashboard');
    expect(material.querySelector(':scope > mat-icon[iconPositionEnd]')?.textContent).toBe(
      'expand_more'
    );
  });

  it('should open nested dropdowns with router links to the pages', async () => {
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    const buttons = document.querySelector<HTMLElement>('[role="menu"] [mat-menu-item]');
    expect(buttons?.classList).toContain('active');

    buttons?.click();
    await fixture.whenStable();
    const current = document.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    expect(current?.getAttribute('href')).toBe('/material/buttons/button');
  });
});
