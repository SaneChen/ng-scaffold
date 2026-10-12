/**
 * Real overlay interaction tests for MaterialTooltip; replaces the generated creation test.
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
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MaterialTooltip } from './tooltip';

describe('MaterialTooltip', () => {
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
          { path: '', providers: [provideChildTranslateService()], component: MaterialTooltip },
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

  it('should name each tooltip and toggle it through the explicit button', async () => {
    const tooltips = harness.routeDebugElement!.queryAll(By.directive(MatTooltip));
    expect(tooltips.map(element => element.injector.get(MatTooltip).position)).toEqual([
      'below',
      'below',
      'below',
      'above',
      'before',
      'after',
      'left',
      'right',
      'below',
    ]);
    expect(tooltips.at(-1)!.injector.get(MatTooltip).showDelay).toBe(2000);
    const rendered = await TestbedHarnessEnvironment.loader(harness.fixture).getAllHarnesses(
      MatTooltipHarness
    );
    button(host, 'Toggle the tooltip').click();
    await harness.fixture.whenStable();
    await vi.waitFor(() =>
      expect(document.querySelector('mat-tooltip-component .mat-mdc-tooltip-show')).not.toBeNull()
    );
    expect(await rendered[1].getTooltipText()).toContain('This tooltip can be toggled');
    button(host, 'Toggle the tooltip').click();
    await harness.fixture.whenStable();
    await vi.waitFor(async () => expect(await rendered[1].isOpen()).toBe(false));
  });
});
