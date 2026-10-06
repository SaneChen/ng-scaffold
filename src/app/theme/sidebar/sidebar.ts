/**
 * `<app-sidebar>`: content of the side navigation drawer (branding, user panel, menu).
 *
 * How this file was built:
 *   1. `yarn ng g component theme/sidebar` generated the component, template, styles and spec.
 *   2. Inputs `showHeader`, `showToggle`, `showUser`, `collapsed`; outputs `toggleCollapsed` and
 *      `closeNav`. The header row holds the branding and either the collapse switch (desktop) or
 *      a close button (mobile drawer); the menu sits in a `<nav>` landmark with a translated name.
 *   3. `compact` (collapsed and neither hovered nor focused from the keyboard) follows host mouse
 *      events and CDK `FocusMonitor` (keyboard origin only: a mouse click also focuses the clicked
 *      link, and the rail must not stay wide after it), so the branding,
 *      user panel and menu switch between icons and full width together.
 *
 * Why: ng-matero widened the rail on `:hover` only, so keyboard users moved through an icon-only
 * menu, and its switch had no accessible name.
 */
import { FocusMonitor } from '@angular/cdk/a11y';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';
import { Sidemenu } from '../sidemenu/sidemenu';
import { UserPanel } from '../user-panel/user-panel';
import { Branding } from '../widgets/branding/branding';

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatToolbarModule,
    TranslatePipe,
    Branding,
    Sidemenu,
    UserPanel,
  ],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
  },
})
export class Sidebar {
  readonly showHeader = input(true);
  /** Collapse switch (desktop) instead of a close button (mobile drawer). */
  readonly showToggle = input(true);
  readonly showUser = input(true);
  /** The rail is collapsed to icons (it widens while hovered or focused). */
  readonly collapsed = input(false);

  readonly toggleCollapsed = output<void>();
  readonly closeNav = output<void>();

  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);

  /** Icons only: collapsed and not in use. */
  protected readonly compact = computed(
    () => this.collapsed() && !this.hovered() && !this.focused()
  );

  constructor() {
    const host = inject(ElementRef);
    const focusMonitor = inject(FocusMonitor);
    focusMonitor
      .monitor(host, true)
      .pipe(takeUntilDestroyed())
      .subscribe(origin => this.focused.set(origin === 'keyboard'));
    inject(DestroyRef).onDestroy(() => focusMonitor.stopMonitoring(host));
  }
}
