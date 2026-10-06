/**
 * `<app-header>`: the top bar of the admin layout (menu toggle, branding, widgets).
 *
 * How this file was built:
 *   1. `yarn ng g component theme/header` generated the component, its template, styles and spec.
 *   2. Inputs `showToggle`, `showBranding` and `navOpened` (mirrored as `aria-expanded` of the menu
 *      button), outputs `toggleNav` and `openNotices`; the widgets of theme/widgets; host
 *      `role="banner"` (the layout positions the `app-header` element itself).
 *   3. Every icon button has a translated `aria-label`. ng-matero's search button, which did
 *      nothing, is not ported; the full-screen, notification and notice buttons are hidden below
 *      the `sm` breakpoint with the responsive display utilities (ng-matero's `.hide-small`).
 *
 * Why: the layout decides what the header shows and reacts to its events; the header holds no
 * state of its own.
 */
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';
import { Branding } from '../widgets/branding/branding';
import { FullscreenButton } from '../widgets/fullscreen-button/fullscreen-button';
// <demo>
import { GithubButton } from '../widgets/github-button/github-button';
// </demo>
import { NotificationButton } from '../widgets/notification-button/notification-button';
import { TranslateButton } from '../widgets/translate-button/translate-button';
import { UserButton } from '../widgets/user-button/user-button';

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    TranslatePipe,
    Branding,
    FullscreenButton,
    // <demo>
    GithubButton,
    // </demo>
    NotificationButton,
    TranslateButton,
    UserButton,
  ],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
  host: {
    role: 'banner',
  },
})
export class Header {
  /** Show the button that opens or closes the navigation menu. */
  readonly showToggle = input(true);
  /** Show the logo and name (when the side menu, which also shows them, is not there). */
  readonly showBranding = input(false);
  /** Whether the navigation menu is open (for the toggle's `aria-expanded`). */
  readonly navOpened = input(false);
  /** Id of the navigation menu the toggle controls (`aria-controls`). */
  readonly navId = input<string>();

  readonly toggleNav = output<void>();
  readonly openNotices = output<void>();
}
