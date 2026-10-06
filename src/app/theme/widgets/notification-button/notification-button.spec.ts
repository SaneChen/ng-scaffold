/**
 * Unit tests for `NotificationButton`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/notification-button --inline-template --inline-style`
 *      generated the "should create" test.
 *   2. Replaced it with a check that the badge, the accessible name and the menu agree on the
 *      number of notifications (the badge read through `MatBadgeHarness`).
 */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatBadgeHarness } from '@angular/material/badge/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { NotificationButton } from './notification-button';

describe('NotificationButton', () => {
  it('should show as many notifications as the badge and the label announce', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', { header: { notifications: 'Notifications ({{count}})' } });
    translate.use('en-US');
    const fixture = TestBed.createComponent(NotificationButton);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    await fixture.whenStable();

    const items = document.querySelectorAll('[mat-menu-item]');
    expect(button.getAttribute('aria-label')).toBe(`Notifications (${items.length})`);
    const badge = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatBadgeHarness);
    expect(await badge.getText()).toBe(String(items.length));
  });
});
