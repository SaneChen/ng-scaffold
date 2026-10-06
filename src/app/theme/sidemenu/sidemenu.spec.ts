/**
 * Unit tests for `Sidemenu`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/sidemenu` generated the "should create" test.
 *   2. Replaced it with tests against a real router and `MenuStore`: the active link
 *      (`aria-current`), groups of the current page opened on navigation, the accordion with
 *      `aria-expanded` / `aria-controls`, external links, permission filtering and compact mode;
 *      then the nested accordion, letter icons and tag text colors.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Menu, MenuStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { Sidemenu } from './sidemenu';

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
      { route: 'button', name: 'button', type: 'link' },
      { route: 'card', name: 'card', type: 'link' },
    ],
  },
  {
    route: 'forms',
    name: 'forms',
    type: 'sub',
    icon: 'description',
    label: { color: 'azure-40', value: 'New' },
    badge: { color: 'red-90', value: '2' },
    children: [
      {
        route: 'advanced',
        name: 'advanced',
        type: 'sub',
        children: [
          {
            route: 'wizard',
            name: 'wizard',
            type: 'sub',
            children: [{ route: 'steps', name: 'steps', type: 'link' }],
          },
          {
            route: 'layout',
            name: 'layout',
            type: 'sub',
            children: [{ route: 'grid', name: 'grid', type: 'link' }],
          },
        ],
      },
    ],
  },
  { route: 'admin', name: 'admin', type: 'link', icon: 'lock', permissions: { only: 'ADMIN' } },
  { route: 'https://example.com', name: 'docs', type: 'extTabLink', icon: 'extension' },
];

describe('Sidemenu', () => {
  let harness: RouterTestingHarness;
  let fixture: ComponentFixture<Sidemenu>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Page }]), provideTranslateService()],
    });
    TestBed.inject(MenuStore).set(MENU);
    harness = await RouterTestingHarness.create('/material/card');
    fixture = TestBed.createComponent(Sidemenu);
    await fixture.whenStable();
  });

  function group(name: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`button[aria-controls="sidemenu-menu-${name}"]`);
  }

  it('should mark the current page and open its group', () => {
    const current: HTMLAnchorElement = fixture.nativeElement.querySelector('[aria-current="page"]');

    expect(current.getAttribute('href')).toBe('/material/card');
    expect(group('material').getAttribute('aria-expanded')).toBe('true');
    expect(group('forms').getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#sidemenu-menu-material')).not.toBeNull();
  });

  it('should open one group at a time and follow navigation', async () => {
    group('forms').click();
    await fixture.whenStable();
    expect(group('forms').getAttribute('aria-expanded')).toBe('true');
    expect(group('material').getAttribute('aria-expanded')).toBe('false');

    await harness.navigateByUrl('/material/button');
    await fixture.whenStable();
    expect(group('material').getAttribute('aria-expanded')).toBe('true');
    expect(group('forms').getAttribute('aria-expanded')).toBe('false');
  });

  it('should hide items the user may not see and announce new tabs', () => {
    const links = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a'));
    const external = links.find(link => link.target === '_blank');

    expect(links.some(link => link.getAttribute('href') === '/admin')).toBe(false);
    expect(external?.rel).toBe('noopener');
    expect(external?.textContent).toContain('sidebar.new_tab');
  });

  it('should switch to compact mode', async () => {
    fixture.componentRef.setInput('compact', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.classList).toContain('compact');
  });

  it('should keep the ancestors of a nested group open and close its open siblings', async () => {
    for (const name of [
      'forms',
      'forms-advanced',
      'forms-advanced-wizard',
      'forms-advanced-layout',
    ]) {
      group(name).click();
      await fixture.whenStable();
    }
    expect(
      ['forms', 'forms-advanced', 'forms-advanced-wizard', 'forms-advanced-layout'].map(name =>
        group(name).getAttribute('aria-expanded')
      )
    ).toEqual(['true', 'true', 'false', 'true']);

    group('forms-advanced').click();
    await fixture.whenStable();
    expect(group('forms-advanced-layout').getAttribute('aria-expanded')).toBe('false');
    expect(group('forms').getAttribute('aria-expanded')).toBe('true');
  });

  it('should give sub-items a letter icon and tags a readable text color', () => {
    const letters = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.letter'));
    const forms = group('forms');

    expect(letters.map(letter => letter.textContent?.trim())).toContain('m');
    expect(forms.querySelector('.menu-tag:not(.badge)')?.className).toContain('text-white');
    expect(forms.querySelector('.menu-tag.badge')?.className).toContain('text-black');
  });
});
