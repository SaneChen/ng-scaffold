/**
 * Unit tests for `Sidebar`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/sidebar` generated the "should create" test.
 *   2. Replaced it with tests of the collapse switch and the close button (events and accessible
 *      names), the named navigation landmark, and the collapsed rail widening on hover and while
 *      keyboard focus is inside, but not after a mouse click.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(Sidebar);
    await fixture.whenStable();
  });

  function compact(): boolean {
    return fixture.nativeElement.querySelector('app-sidemenu').classList.contains('compact');
  }

  it('should name the navigation landmark and the collapse switch', () => {
    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe(
      'sidebar.navigation'
    );
    expect(fixture.nativeElement.querySelector('[role="switch"]').getAttribute('aria-label')).toBe(
      'sidebar.collapse'
    );
  });

  it('should emit toggleCollapsed from the switch and closeNav from the mobile close button', async () => {
    const collapsed = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.toggleCollapsed.subscribe(collapsed);
    fixture.componentInstance.closeNav.subscribe(closed);

    fixture.nativeElement.querySelector('[role="switch"]').click();
    fixture.componentRef.setInput('showToggle', false);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('[aria-label="sidebar.close"]').click();

    expect(collapsed).toHaveBeenCalled();
    expect(closed).toHaveBeenCalled();
  });

  it('should widen the collapsed rail while hovered or focused from the keyboard', async () => {
    const host: HTMLElement = fixture.nativeElement;
    const link = host.querySelector<HTMLElement>('a') as HTMLElement;
    fixture.componentRef.setInput('collapsed', true);
    await fixture.whenStable();
    expect(compact()).toBe(true);

    host.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(compact()).toBe(false);

    host.dispatchEvent(new MouseEvent('mouseleave'));
    // FocusMonitor attributes a focus that follows a key press to the keyboard.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    link.focus();
    await fixture.whenStable();
    expect(compact()).toBe(false);

    link.blur();
    await fixture.whenStable();
    expect(compact()).toBe(true);
  });

  it('should stay narrow after a mouse click focused one of its links', async () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLElement;
    fixture.componentRef.setInput('collapsed', true);
    await fixture.whenStable();

    link.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1, detail: 1 }));
    link.focus();
    await fixture.whenStable();

    expect(compact()).toBe(true);
  });
});
