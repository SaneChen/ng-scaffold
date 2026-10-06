/**
 * Unit tests for `AdminLayout`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/admin-layout` generated the "should create" test.
 *   2. Replaced it with tests of the layout states with a fake `MediaMatcher` (desktop or
 *      mobile): side menu open/closed, the collapsed rail, the mobile drawer closing after
 *      navigation, top navigation, header above, the skip link, the notice side sheet and the
 *      translated paginator labels it provides; then (review) the menu button with a collapsed
 *      rail and with the header above, "above" with top navigation, the header kept on mobile, a
 *      drawer closed by Escape and the scroll to the top.
 */
import { MediaMatcher } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatSidenav } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { SettingsStore } from '@core';
import { PaginatorIntl } from '@core/i18n/paginator-intl';
import { provideTranslateService } from '@ngx-translate/core';
import { SideSheet } from '../side-sheet/side-sheet';
import { NOTICE_TITLE_ID, SidebarNotice } from '../sidebar-notice/sidebar-notice';
import { AdminLayout, MOBILE_QUERY } from './admin-layout';

@Component({ template: 'page' })
class Page {}

describe('AdminLayout', () => {
  let fixture: ComponentFixture<AdminLayout>;
  let settings: SettingsStore;

  async function create(mobile = false) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: Page }]),
        provideTranslateService(),
        {
          provide: MediaMatcher,
          useValue: {
            matchMedia: (query: string) => ({
              matches: query === MOBILE_QUERY && mobile,
              media: query,
              addListener: () => undefined,
              removeListener: () => undefined,
            }),
          },
        },
      ],
    });
    settings = TestBed.inject(SettingsStore);
    fixture = TestBed.createComponent(AdminLayout);
    await fixture.whenStable();
  }

  function sidenav(): MatSidenav {
    return fixture.debugElement.query(By.directive(MatSidenav)).componentInstance;
  }

  function menuButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('[aria-label="header.toggle_menu"]');
  }

  beforeAll(() => {
    // jsdom has no scrolling; the layout scrolls the content to the top after each navigation.
    Element.prototype.scrollTo ??= () => undefined;
  });

  afterEach(() => localStorage.clear());

  it('should show the side menu beside the content and toggle it from the header', async () => {
    await create();
    expect(sidenav().mode).toBe('side');
    expect(sidenav().opened).toBe(true);
    expect(menuButton()?.getAttribute('aria-controls')).toBe(
      fixture.nativeElement.querySelector('mat-sidenav').id
    );

    menuButton()?.click();
    await fixture.whenStable();

    expect(settings.options().sidenavOpened).toBe(false);
    expect(sidenav().opened).toBe(false);
  });

  it('should turn the side menu into a rail over the content when collapsed', async () => {
    await create();
    settings.update({ sidenavCollapsed: true });
    await fixture.whenStable();

    expect(fixture.nativeElement.classList).toContain('collapsed');
    expect(sidenav().mode).toBe('over');
    expect(sidenav().opened).toBe(true);
    expect(menuButton()?.getAttribute('aria-expanded')).toBe('false');

    menuButton()?.click();
    await fixture.whenStable();

    expect(settings.options().sidenavCollapsed).toBe(false);
    expect(sidenav().mode).toBe('side');
  });

  it('should keep the menu button with the header above, also when collapsed', async () => {
    await create();
    settings.update({ headerPos: 'above', sidenavCollapsed: true });
    await fixture.whenStable();

    menuButton()?.click();
    await fixture.whenStable();

    expect(settings.options().sidenavCollapsed).toBe(false);
  });

  it('should treat "above" as fixed with top navigation', async () => {
    await create();
    settings.update({ navPos: 'top', headerPos: 'above' });
    await fixture.whenStable();

    expect(fixture.nativeElement.classList).toContain('header-fixed');
    expect(fixture.nativeElement.querySelector('mat-sidenav-content app-header')).not.toBeNull();
    expect(menuButton()).toBeNull();
  });

  it('should keep the header on mobile, where it opens the drawer', async () => {
    await create(true);
    settings.update({ showHeader: false });
    await fixture.whenStable();

    expect(menuButton()).not.toBeNull();
  });

  it('should report a drawer closed by Escape at once', async () => {
    await create(true);
    menuButton()?.click();
    await fixture.whenStable();

    fixture.nativeElement
      .querySelector('mat-sidenav')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    await fixture.whenStable();

    expect(menuButton()?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should scroll the content back to the top after a navigation', async () => {
    await create();
    const scrollTo = vi.spyOn(Element.prototype, 'scrollTo');

    await TestBed.inject(Router).navigateByUrl('/next');

    expect(scrollTo).toHaveBeenCalled();
    scrollTo.mockRestore();
  });

  it('should use a closed drawer on mobile and close it after navigating', async () => {
    await create(true);
    expect(sidenav().mode).toBe('over');
    expect(sidenav().opened).toBe(false);

    menuButton()?.click();
    await fixture.whenStable();
    expect(sidenav().opened).toBe(true);

    await TestBed.inject(Router).navigateByUrl('/elsewhere');
    await fixture.whenStable();
    expect(sidenav().opened).toBe(false);
  });

  it('should show the top menu and the header branding for top navigation', async () => {
    await create();
    settings.update({ navPos: 'top' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-topmenu')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-header app-branding')).not.toBeNull();
    expect(sidenav().opened).toBe(false);
  });

  it('should render the header above the container', async () => {
    await create();
    settings.update({ headerPos: 'above' });
    await fixture.whenStable();

    const header = fixture.nativeElement.querySelector(':scope > app-header');
    expect(header).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-sidenav-content app-header')).toBeNull();
  });

  it('should move focus to the main content from the skip link', async () => {
    await create();

    fixture.nativeElement.querySelector('.skip-link').click();

    expect(document.activeElement?.tagName).toBe('MAIN');
  });

  it('should open the notice panel as a side sheet', async () => {
    await create();
    const open = vi.spyOn(TestBed.inject(SideSheet), 'open').mockReturnValue(undefined as never);

    fixture.nativeElement.querySelector('[aria-label="header.notices"]').click();

    expect(open).toHaveBeenCalledWith(SidebarNotice, { ariaLabelledBy: NOTICE_TITLE_ID });
  });

  it('should give the pages translated paginator labels', async () => {
    await create();

    expect(fixture.debugElement.injector.get(MatPaginatorIntl)).toBeInstanceOf(PaginatorIntl);
  });
});
