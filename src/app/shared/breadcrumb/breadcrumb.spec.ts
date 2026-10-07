/**
 * Unit tests for `Breadcrumb`.
 *
 * How this file was built:
 *   1. `yarn ng g component shared/breadcrumb --inline-template --inline-style` generated the
 *      "should create" test.
 *   2. Replaced it with tests against a real router and `MenuStore`: the trail of the current
 *      page after "Home", `aria-current` on the last item, the update after a navigation (also
 *      one with `skipLocationChange`), and the `nav` input overriding the menu.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Menu, MenuStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { Breadcrumb } from './breadcrumb';

@Component({ template: '' })
class Page {}

const MENU: Menu[] = [
  { route: 'dashboard', name: 'dashboard', type: 'link', icon: 'dashboard' },
  {
    route: 'material',
    name: 'material',
    type: 'sub',
    icon: 'favorite',
    children: [{ route: 'button', name: 'button', type: 'link' }],
  },
];

describe('Breadcrumb', () => {
  let harness: RouterTestingHarness;
  let fixture: ComponentFixture<Breadcrumb>;

  function texts(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('li')).map(
      li => li.textContent?.replace('chevron_right', '').trim() ?? ''
    );
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Page }]), provideTranslateService()],
    });
    TestBed.inject(MenuStore).set(MENU);
    harness = await RouterTestingHarness.create('/material/button');
    fixture = TestBed.createComponent(Breadcrumb);
    await fixture.whenStable();
  });

  it('should list the menu trail of the current page after a home link', () => {
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');

    expect(nav.getAttribute('aria-label')).toBe('breadcrumb.label');
    expect(texts()).toEqual(['breadcrumb.home', 'menu.material', 'menu.material.button']);
    expect(nav.querySelector('a')?.getAttribute('href')).toBe('/');
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('menu.material.button');
  });

  it('should follow navigation, including pages shown without a URL change', async () => {
    await harness.navigateByUrl('/dashboard');
    await fixture.whenStable();
    expect(texts()).toEqual(['breadcrumb.home', 'menu.dashboard']);

    await TestBed.inject(Router).navigateByUrl('/unknown', { skipLocationChange: true });
    await fixture.whenStable();
    expect(texts()).toEqual(['breadcrumb.home']);
  });

  it('should show the given items instead of the menu trail', async () => {
    fixture.componentRef.setInput('nav', ['profile', 'profile.settings']);
    await fixture.whenStable();

    expect(texts()).toEqual(['breadcrumb.home', 'profile', 'profile.settings']);
  });
});
