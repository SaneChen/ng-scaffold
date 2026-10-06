/**
 * `SidebarNotice`: the notice panel (opened as a side sheet from the header).
 *
 * How this file was built:
 *   1. `yarn ng g component theme/sidebar-notice` generated the component, template, styles and
 *      spec.
 *   2. A dialog title with a close button and ng-matero's two tabs of demo notices ("Today",
 *      "Notifications"), with every text translated (`notice.*`).
 *
 * Why: opened through `SideSheet`, the panel is a labelled dialog (focus trap, Escape, focus back
 * to the header button) instead of ng-matero's second sidenav without a title.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';

/** Id of the panel's title, for the dialog's `aria-labelledby`. */
export const NOTICE_TITLE_ID = 'notice-panel-title';

interface Notice {
  icon: string;
  color: string;
  key: string;
}

@Component({
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTabsModule, TranslatePipe],
  selector: 'app-sidebar-notice',
  styleUrl: './sidebar-notice.scss',
  templateUrl: './sidebar-notice.html',
})
export class SidebarNotice {
  protected readonly titleId = NOTICE_TITLE_ID;

  protected readonly tabs: { label: string; notices: Notice[] }[] = [
    {
      label: 'notice.today',
      notices: [
        { icon: '🔔', color: 'bg-red-95', key: 'notice.meeting' },
        { icon: '📢', color: 'bg-azure-95', key: 'notice.widgets' },
        { icon: '⏳', color: 'bg-violet-95', key: 'notice.features' },
      ],
    },
    {
      label: 'notice.notifications',
      notices: [{ icon: '📩', color: 'bg-magenta-95', key: 'notice.reports' }],
    },
  ];
}
