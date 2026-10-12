/**
 * Real overlay interaction tests for MaterialBottomSheet; replaces the generated creation test.
 * Demo dictionaries exist only in the route's child translation service.
 */
import { TestBed } from '@angular/core/testing';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  provideTranslateService,
  provideChildTranslateService,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import zhCN from '../../../../../public/i18n/demo/zh-CN.json';
import { MaterialBottomSheet } from './bottom-sheet';

describe('MaterialBottomSheet', () => {
  let harness: RouterTestingHarness;
  let host: HTMLElement;
  let translate: TranslateService;

  function button(root: ParentNode, label: string): HTMLButtonElement {
    const result = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      button => button.textContent?.trim() === label
    );
    if (!result) throw new Error('Button not found: ' + label);
    return result;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({ lang: 'en-US' }),
        provideRouter([
          { path: '', providers: [provideChildTranslateService()], component: MaterialBottomSheet },
        ]),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        {
          provide: InteractivityChecker,
          useValue: {
            isDisabled: (element: HTMLElement) => element.hasAttribute('disabled'),
            isVisible: () => true,
            isFocusable: (element: HTMLElement) =>
              ['BUTTON', 'INPUT', 'A'].includes(element.tagName) &&
              !element.hasAttribute('disabled'),
            isTabbable: (element: HTMLElement) =>
              ['BUTTON', 'INPUT', 'A'].includes(element.tagName) &&
              !element.hasAttribute('disabled'),
          },
        },
      ],
    });
    harness = await RouterTestingHarness.create('/');
    host = harness.routeNativeElement!;
    translate = harness.routeDebugElement!.injector.get(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    await harness.fixture.whenStable();
  });

  it('should open component and template content with translated actions and an explicit close path', async () => {
    const checkboxes = host.querySelectorAll<HTMLInputElement>('mat-checkbox input');
    checkboxes[1].click();
    await harness.fixture.whenStable();
    button(host, 'Open component sheet').click();
    await harness.fixture.whenStable();
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Bottom sheet actions'
    );
    const content = document.querySelector('app-sheet-actions')!;
    expect(content.textContent).toContain('Action 1');
    content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true })
    );
    await harness.fixture.whenStable();
    expect(document.querySelector('app-sheet-actions')).not.toBeNull();
    button(content, 'Close').click();
    await harness.fixture.whenStable();
    await vi.waitFor(() => expect(document.querySelector('app-sheet-actions')).toBeNull());
    button(host, 'Open template sheet').click();
    await harness.fixture.whenStable();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Action 3');
    button(dialog, 'Close').click();
    await harness.fixture.whenStable();
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  });

  it('should dismiss an open sheet when the language changes', async () => {
    button(host, 'Open component sheet').click();
    await harness.fixture.whenStable();
    translate.setTranslation('zh-CN', zhCN);
    await firstValueFrom(translate.use('zh-CN'));
    await harness.fixture.whenStable();
    await vi.waitFor(() => expect(document.querySelector('app-sheet-actions')).toBeNull());
    expect(host.textContent).toContain('打开组件面板');
  });
});
