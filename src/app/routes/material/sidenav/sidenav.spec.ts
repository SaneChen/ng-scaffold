/**
 * Unit tests for the sidenav demo: the index and its three examples.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/sidenav` (and the three `--flat` examples) generated
 *      "should create" tests; they were merged here.
 *   2. Tests through a real router (`RouterTestingHarness`) with animations disabled and a CDK
 *      `InteractivityChecker` that sees buttons (jsdom has no layout): the index
 *      links, the menu button's `aria-expanded`, the current example, the responsive mode, and the
 *      playlists (focus on open, toast on play).
 */
import { InteractivityChecker } from '@angular/cdk/a11y';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatSidenav } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Toaster } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MaterialBasicSidenav } from './basic-sidenav';
import { MaterialDualSidenav } from './dual-sidenav';
import { MaterialMobileSidenav } from './mobile-sidenav';
import { MaterialSidenav } from './sidenav';

describe('sidenav demo', () => {
  let harness: RouterTestingHarness;
  const success = vi.fn();
  const narrow = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });

  function host(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  beforeEach(async () => {
    success.mockReset();
    narrow.next({ matches: false, breakpoints: {} });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'sidenav',
            children: [
              { path: '', component: MaterialSidenav },
              { path: 'basic', component: MaterialBasicSidenav },
              { path: 'mobile', component: MaterialMobileSidenav },
              { path: 'dual', component: MaterialDualSidenav },
            ],
          },
        ]),
        provideTranslateService(),
        { provide: Toaster, useValue: { success } },
        { provide: BreakpointObserver, useValue: { observe: () => narrow } },
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        // jsdom has no layout, so the CDK would find no visible element to focus in a drawer.
        {
          provide: InteractivityChecker,
          useValue: {
            isDisabled: () => false,
            isVisible: () => true,
            isFocusable: (element: HTMLElement) => ['BUTTON', 'A'].includes(element.tagName),
            isTabbable: (element: HTMLElement) => ['BUTTON', 'A'].includes(element.tagName),
          },
        },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('should link to every example with its own text', async () => {
    await harness.navigateByUrl('/sidenav');

    const links = Array.from(host().querySelectorAll('mat-card a'));
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/sidenav/basic',
      '/sidenav/mobile',
      '/sidenav/dual',
    ]);
    expect(links.map(link => link.textContent?.trim())).toEqual([
      'demo.material.sidenav.basic.open',
      'demo.material.sidenav.mobile.open',
      'demo.material.sidenav.dual.open',
    ]);
  });

  it('should toggle the basic sidenav and mark the current example', async () => {
    await harness.navigateByUrl('/sidenav/basic');
    const button = host().querySelector<HTMLButtonElement>('mat-toolbar button');
    expect(button?.getAttribute('aria-expanded')).toBe('false');

    button?.click();
    await harness.fixture.whenStable();

    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(host().querySelector('mat-sidenav a[aria-current="page"]')?.getAttribute('href')).toBe(
      '/sidenav/basic'
    );
  });

  it('should open the responsive sidenav over the content on narrow screens', async () => {
    await harness.navigateByUrl('/sidenav/mobile');
    const sidenav = () =>
      harness.fixture.debugElement.query(By.directive(MatSidenav)).componentInstance as MatSidenav;
    expect(sidenav().mode).toBe('side');

    narrow.next({ matches: true, breakpoints: {} });
    await harness.fixture.whenStable();

    expect(sidenav().mode).toBe('over');
  });

  it('should focus the first playlist and play it', async () => {
    await harness.navigateByUrl('/sidenav/dual');
    const toggle = host().querySelectorAll<HTMLButtonElement>('mat-toolbar button')[1];

    toggle.click();
    await harness.fixture.whenStable();

    const first = host().querySelector<HTMLButtonElement>('.playlists button');
    // The drawer reports the opening asynchronously, then moves the focus after a render.
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.activeElement).toBe(first);
    });

    first?.click();
    expect(success).toHaveBeenCalledWith('demo.material.sidenav.dual.playing');
  });

  it.each(['basic', 'mobile', 'dual'])(
    'should restore focus after Escape in the %s navigation',
    async example => {
      await harness.navigateByUrl('/sidenav/' + example);
      const toggle = host().querySelector<HTMLButtonElement>('mat-toolbar button')!;
      toggle.focus();
      toggle.click();
      await harness.fixture.whenStable();
      const link = host().querySelector<HTMLAnchorElement>('mat-sidenav a')!;
      await vi.waitFor(() => {
        TestBed.tick();
        expect(document.activeElement).toBe(link);
      });
      link.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true })
      );
      await harness.fixture.whenStable();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(toggle);
    }
  );

  it('should close an open drawer when entering the narrow breakpoint', async () => {
    await harness.navigateByUrl('/sidenav/mobile');
    const toggle = host().querySelector<HTMLButtonElement>('mat-toolbar button')!;
    toggle.focus();
    toggle.click();
    await harness.fixture.whenStable();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.activeElement).toBe(host().querySelector('mat-sidenav a'));
    });
    const contentLink = host().querySelector<HTMLAnchorElement>('mat-sidenav-content a')!;
    contentLink.focus();
    narrow.next({ matches: true, breakpoints: {} });
    await harness.fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(contentLink);
  });
});
