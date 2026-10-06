/**
 * `<app-notification-button>`: bell with an unread count and a menu of the latest notifications.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/notification-button --inline-template --inline-style`
 *      generated the component and its spec.
 *   2. Ports ng-matero's demo content (three "server error report" messages, translated) as menu
 *      items; the badge shows their count with the theme's error colors (Material's default).
 *
 * Why: ng-matero's badge said 5 for 3 messages, used `href="#"` links, overrode the badge colors
 * through `::ng-deep` with hex values and had no accessible name. A real application replaces
 * `messages` with its notification source.
 */
import { Component } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  selector: 'app-notification-button',
  styles: ``,
  template: `
    <button
      matIconButton
      type="button"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="'header.notifications' | translate: { count: messages.length }"
    >
      <mat-icon [matBadge]="messages.length" aria-hidden="true">notifications</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      @for (message of messages; track message) {
        <button mat-menu-item type="button">
          <mat-icon>info</mat-icon>
          <span>{{ message | translate }}</span>
        </button>
      }
    </mat-menu>
  `,
})
export class NotificationButton {
  /** Translation keys of the demo notifications. */
  protected readonly messages = [
    'header.messages.report_1',
    'header.messages.report_2',
    'header.messages.report_3',
  ];
}
