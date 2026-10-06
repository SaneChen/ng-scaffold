/**
 * Unit tests for `SidebarNotice`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/sidebar-notice` generated the "should create" test.
 *   2. Replaced it with checks of the dialog title (target of `aria-labelledby`), the labelled
 *      close button and the translated notices of the first tab.
 */
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { NOTICE_TITLE_ID, SidebarNotice } from './sidebar-notice';

describe('SidebarNotice', () => {
  it('should render a titled panel with a close button and the notices', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(SidebarNotice);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector(`#${NOTICE_TITLE_ID}`)?.textContent).toBe('notice.title');
    expect(element.querySelector('[mat-dialog-close]')?.getAttribute('aria-label')).toBe('close');
    expect(Array.from(element.querySelectorAll('li strong'), item => item.textContent)).toEqual([
      'notice.meeting.title',
      'notice.widgets.title',
      'notice.features.title',
    ]);
  });
});
