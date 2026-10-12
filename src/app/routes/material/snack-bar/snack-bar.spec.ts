/**
 * Real overlay interaction tests for MaterialSnackBar; replaces the generated creation test.
 * Demo dictionaries exist only in the route's child translation service.
 */
import { TestBed } from '@angular/core/testing';
import { EventEmitter, signal } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { MatSelectHarness } from '@angular/material/select/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
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
import { MaterialSnackBar } from './snack-bar';

describe('MaterialSnackBar', () => {
  const directionChanges = new EventEmitter<'ltr' | 'rtl'>();
  const direction = signal<'ltr' | 'rtl'>('rtl');
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
    direction.set('rtl');
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({ lang: 'en-US' }),
        {
          provide: Directionality,
          useValue: {
            get value() {
              return direction();
            },
            valueSignal: direction.asReadonly(),
            change: directionChanges,
          },
        },
        provideRouter([
          { path: '', providers: [provideChildTranslateService()], component: MaterialSnackBar },
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

  it('should place start on the right in RTL and dismiss before direction changes', async () => {
    const selects = await TestbedHarnessEnvironment.loader(harness.fixture).getAllHarnesses(
      MatSelectHarness
    );
    await selects[0].clickOptions({ text: 'Start' });
    button(host, 'Open snack bar').click();
    await harness.fixture.whenStable();
    const container = document.querySelector('mat-snack-bar-container')!;
    expect(container.closest('[dir]')?.getAttribute('dir')).toBe('rtl');
    expect((container.parentElement!.parentElement as HTMLElement).style.justifyContent).toBe(
      'flex-start'
    );
    direction.set('ltr');
    directionChanges.emit('ltr');
    await harness.fixture.whenStable();
    await vi.waitFor(() => expect(document.querySelector('mat-snack-bar-container')).toBeNull());
    button(host, 'Open template snack bar').click();
    await harness.fixture.whenStable();
    const updated = document.querySelector('mat-snack-bar-container')!;
    expect(updated.closest('[dir]')?.getAttribute('dir')).toBe('ltr');
    expect((updated.parentElement!.parentElement as HTMLElement).style.justifyContent).toBe(
      'flex-start'
    );
  });

  it('should pass a user message to the snack bar and support the template and explicit dismissal', async () => {
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.value = 'Local demo message';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
    button(host, 'Open snack bar').click();
    await harness.fixture.whenStable();
    expect(document.querySelector('mat-snack-bar-container')?.textContent).toContain(
      'Local demo message'
    );
    button(host, 'Dismiss snack bar').click();
    await harness.fixture.whenStable();
    expect(document.querySelector('mat-snack-bar-container')).toBeNull();
    button(host, 'Open template snack bar').click();
    await harness.fixture.whenStable();
    const content = document.querySelector('mat-snack-bar-container')!;
    expect(content.textContent).toContain('Local demo message');
    button(content, 'Close').click();
    await harness.fixture.whenStable();
    expect(document.querySelector('mat-snack-bar-container')).toBeNull();
  });
});
