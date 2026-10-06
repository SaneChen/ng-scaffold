/**
 * `AdminLayout`: the shell of every signed-in page (navigation, header, content, settings).
 *
 * How this file was built:
 *   1. `yarn ng g component theme/admin-layout` generated the component, template, styles and spec.
 *   2. A `mat-sidenav-container` whose navigation drawer has three states, all derived with
 *      `computed()` from `SettingsStore.options()` and a mobile breakpoint (`BreakpointObserver`
 *      → `toSignal`):
 *      - desktop, open: `side` mode beside the content (`sidenavOpened`);
 *      - desktop, collapsed: an icon rail in `over` mode without backdrop; Material sets no content
 *        margin in that mode, so the stylesheet reserves the rail's width and the rail widens over
 *        the content while hovered or focused from the keyboard;
 *      - mobile (< 600px): a drawer in `over` mode with backdrop and focus trap, closed after each
 *        navigation.
 *   3. Header above / fixed / static (always shown on mobile, where its button is the only way to
 *      the drawer; "above" falls back to fixed with top navigation), its menu button for side
 *      navigation in every state (it also expands the collapsed rail), top navigation (`Topmenu`),
 *      the notice panel and the
 *      customizer (side sheets), and a `MatProgressBar` while `Router.currentNavigation()` is
 *      set (a lazy page loading).
 *   4. A skip link moves focus to `<main>` (WCAG 2.4.1); the content scrolls back to the top after
 *      each navigation. The progress bar appears only for navigations longer than 200 ms.
 *   5. Provides the translated `MatPaginatorIntl` (`PaginatorIntl`) for every page: providing it
 *      in app.config.ts made the main bundle reach `@angular/material/paginator` and absorb the
 *      Material modules it shares with the lazy layout.
 *
 * Why: ng-matero mutated `options` in place, saved them after a 400 ms timeout, kept `isOver` in
 * a plain field (stale under default OnPush), needed `ngx-progressbar` and overrode Material's
 * content margins with `!important`. Direction comes from `SettingsStore` (`<html dir>` and the
 * app's `Directionality`), so the layout needs no `[dir]` binding.
 */
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, ElementRef, inject, linkedSignal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavContent, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SettingsStore } from '@core';
import { PaginatorIntl } from '@core/i18n/paginator-intl';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { Customizer } from '../customizer/customizer';
import { Header } from '../header/header';
import { SideSheet } from '../side-sheet/side-sheet';
import { Sidebar } from '../sidebar/sidebar';
import { NOTICE_TITLE_ID, SidebarNotice } from '../sidebar-notice/sidebar-notice';
import { Topmenu } from '../topmenu/topmenu';

/** Below this width the navigation becomes a drawer over the content. */
export const MOBILE_QUERY = '(max-width: 599.98px)';

/** Id of the navigation drawer (target of the header toggle's `aria-controls`). */
export const NAV_ID = 'main-navigation';

@Component({
  imports: [
    MatProgressBarModule,
    MatSidenavModule,
    RouterOutlet,
    TranslatePipe,
    Customizer,
    Header,
    Sidebar,
    Topmenu,
  ],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.scss',
  templateUrl: './admin-layout.html',
  providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntl }],
  host: {
    '[class.nav-side]': "options().navPos === 'side'",
    '[class.nav-top]': "options().navPos === 'top'",
    '[class.header-above]': 'headerAbove()',
    '[class.header-fixed]': 'headerFixed()',
    '[class.collapsed]': 'collapsed()',
  },
})
export class AdminLayout {
  readonly #settings = inject(SettingsStore);
  readonly #sideSheet = inject(SideSheet);
  readonly #router = inject(Router);

  protected readonly navId = NAV_ID;
  protected readonly options = this.#settings.options;

  /** Mobile screen: the navigation is a drawer over the content. */
  protected readonly mobile = toSignal(
    inject(BreakpointObserver)
      .observe(MOBILE_QUERY)
      .pipe(map(state => state.matches)),
    { requireSync: true }
  );

  /** Open state of the mobile drawer (not persisted; closed whenever the breakpoint changes). */
  protected readonly drawerOpened = linkedSignal({ source: this.mobile, computation: () => false });

  protected readonly sideNav = computed(() => this.options().navPos === 'side');
  protected readonly collapsed = computed(
    () => this.sideNav() && this.options().sidenavCollapsed && !this.mobile()
  );
  protected readonly navMode = computed(() =>
    this.mobile() || this.collapsed() ? 'over' : 'side'
  );
  protected readonly navOpened = computed(() => {
    if (this.mobile()) {
      return this.drawerOpened();
    }
    return this.sideNav() && (this.collapsed() || this.options().sidenavOpened);
  });
  /** The header is shown; always on mobile, where it holds the only button to the drawer. */
  protected readonly headerVisible = computed(() => this.options().showHeader || this.mobile());
  /** "Above" only exists with side navigation (the customizer disables the other combination). */
  protected readonly headerAbove = computed(
    () => this.options().showHeader && this.options().headerPos === 'above' && this.sideNav()
  );
  protected readonly headerFixed = computed(
    () =>
      this.options().headerPos === 'fixed' ||
      (this.options().headerPos === 'above' && !this.headerAbove())
  );
  /** The header's menu button shows the full menu (expands the rail, opens the drawer). */
  protected readonly menuExpanded = computed(() => this.navOpened() && !this.collapsed());

  /** A navigation is running (e.g. a lazy page is loading). */
  protected readonly navigating = computed(() => this.#router.currentNavigation() !== null);

  private readonly content = viewChild.required(MatSidenavContent);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    this.#router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.drawerOpened.set(false);
        this.content().scrollTo({ top: 0 });
      });
  }

  protected toggleNav(): void {
    if (this.mobile()) {
      this.drawerOpened.update(opened => !opened);
    } else if (this.collapsed()) {
      this.#settings.update({ sidenavCollapsed: false });
    } else {
      this.#settings.update({ sidenavOpened: !this.options().sidenavOpened });
    }
  }

  /**
   * The drawer started to close by itself (backdrop click or Escape on mobile): `closedStart`
   * fires at once, unlike `openedChange`, which waits for the animation, so the header's
   * `aria-expanded` and a quick second press of its button stay in step.
   */
  protected onClosedStart(): void {
    this.drawerOpened.set(false);
  }

  protected toggleCollapsed(): void {
    this.#settings.update({ sidenavCollapsed: !this.options().sidenavCollapsed });
  }

  protected openNotices(): void {
    this.#sideSheet.open(SidebarNotice, { ariaLabelledBy: NOTICE_TITLE_ID });
  }

  protected skipToContent(): void {
    this.main().nativeElement.focus();
  }
}
