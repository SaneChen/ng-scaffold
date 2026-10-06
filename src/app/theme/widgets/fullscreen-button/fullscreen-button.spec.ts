/**
 * Unit tests for `FullscreenButton`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/fullscreen-button --inline-template --inline-style`
 *      generated the "should create" test.
 *   2. Replaced it with tests against jsdom's document, whose Fullscreen API is stubbed per test:
 *      nothing rendered without support, entering full screen, and the state following
 *      `fullscreenchange` (e.g. Esc pressed in the browser).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FullscreenButton } from './fullscreen-button';

describe('FullscreenButton', () => {
  let fixture: ComponentFixture<FullscreenButton>;
  let fullscreenElement: Element | null;

  function stubApi(enabled: boolean) {
    fullscreenElement = null;
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: enabled });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });
  }

  async function create() {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(FullscreenButton);
    await fixture.whenStable();
  }

  function button(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button');
  }

  afterEach(() => {
    delete (document as unknown as Record<string, unknown>)['fullscreenEnabled'];
    delete (document as unknown as Record<string, unknown>)['fullscreenElement'];
  });

  it('should render nothing where the Fullscreen API is unavailable', async () => {
    stubApi(false);
    await create();

    expect(button()).toBeNull();
  });

  it('should enter full screen and follow fullscreenchange', async () => {
    stubApi(true);
    const request = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = request;
    await create();
    expect(button()?.getAttribute('aria-label')).toBe('header.fullscreen');

    button()?.click();
    expect(request).toHaveBeenCalled();

    fullscreenElement = document.documentElement;
    document.dispatchEvent(new Event('fullscreenchange'));
    await fixture.whenStable();
    expect(button()?.getAttribute('aria-label')).toBe('header.exit_fullscreen');
    expect(button()?.textContent).toContain('fullscreen_exit');
  });
});
