/**
 * Unit tests for `PageHeader`.
 *
 * How this file was built:
 *   1. `yarn ng g component shared/page-header --inline-template --inline-style` generated the
 *      "should create" test.
 *   2. Replaced it with tests for the heading's sources (input, menu, route title, none), the
 *      subtitle and hiding the breadcrumb, with the header rendered by a routed page.
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MenuStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { PageHeader } from './page-header';

@Component({
  imports: [PageHeader],
  template: `
    <app-page-header [heading]="heading()" subtitle="Subtitle" [hideBreadcrumb]="hide()" />
  `,
})
class Page {
  readonly heading = signal('');
  readonly hide = signal(false);
}

describe('PageHeader', () => {
  let harness: RouterTestingHarness;

  async function show(url: string): Promise<HTMLElement> {
    await harness.navigateByUrl(url);
    return harness.routeNativeElement as HTMLElement;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'dashboard', component: Page },
          { path: 'profile', title: 'profile', component: Page },
          { path: 'unnamed', component: Page },
        ]),
        provideTranslateService(),
      ],
    });
    TestBed.inject(MenuStore).set([
      { route: 'dashboard', name: 'dashboard', type: 'link', icon: 'dashboard' },
    ]);
    harness = await RouterTestingHarness.create();
  });

  it('should name the page after its menu item and show the breadcrumb', async () => {
    const page = await show('/dashboard');

    expect(page.querySelector('h1')?.textContent).toBe('menu.dashboard');
    expect(page.querySelector('.subtitle')?.textContent).toBe('Subtitle');
    expect(page.querySelector('app-breadcrumb')).not.toBeNull();
  });

  it('should fall back to the route title for pages outside the menu', async () => {
    const page = await show('/profile');

    expect(page.querySelector('h1')?.textContent).toBe('profile');
  });

  it('should leave out the heading rather than render an empty one', async () => {
    const page = await show('/unnamed');

    expect(page.querySelector('h1')).toBeNull();
  });

  it('should prefer the heading input and hide the breadcrumb on request', async () => {
    const instance = await harness.navigateByUrl('/dashboard', Page);
    instance.heading.set('Custom');
    instance.hide.set(true);
    await harness.fixture.whenStable();
    const page = harness.routeNativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toBe('Custom');
    expect(page.querySelector('app-breadcrumb')).toBeNull();
  });
});
