/**
 * Unit tests for `Header`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/header` generated the "should create" test.
 *   2. Replaced it with tests of the inputs (toggle and branding visibility, `aria-expanded` /
 *      `aria-controls` of the menu button) and outputs, and a check that every button and link of
 *      the bar has an accessible name.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
  });

  function menuButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('[aria-label="header.toggle_menu"]');
  }

  it('should be the banner landmark', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('banner');
  });

  it('should toggle the navigation and expose its state', async () => {
    const toggled = vi.fn();
    fixture.componentInstance.toggleNav.subscribe(toggled);
    fixture.componentRef.setInput('navOpened', true);
    fixture.componentRef.setInput('navId', 'main-nav');
    await fixture.whenStable();

    menuButton()?.click();

    expect(toggled).toHaveBeenCalled();
    expect(menuButton()?.getAttribute('aria-expanded')).toBe('true');
    expect(menuButton()?.getAttribute('aria-controls')).toBe('main-nav');
  });

  it('should hide the toggle and show the branding when asked', async () => {
    fixture.componentRef.setInput('showToggle', false);
    fixture.componentRef.setInput('showBranding', true);
    await fixture.whenStable();

    expect(menuButton()).toBeNull();
    expect(fixture.nativeElement.querySelector('app-branding')).not.toBeNull();
  });

  it('should ask to open the notice panel', () => {
    const opened = vi.fn();
    fixture.componentInstance.openNotices.subscribe(opened);

    fixture.nativeElement.querySelector('[aria-label="header.notices"]').click();

    expect(opened).toHaveBeenCalled();
  });

  it('should give every control an accessible name', () => {
    const controls = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('button, a'));

    expect(controls.length).toBeGreaterThan(4);
    expect(controls.filter(control => !control.getAttribute('aria-label')?.trim())).toEqual([]);
  });
});
