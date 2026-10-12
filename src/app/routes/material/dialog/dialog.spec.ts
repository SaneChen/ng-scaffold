/**
 * Real overlay interaction tests for MaterialDialog; replaces the generated creation test.
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
import { MatDialog } from '@angular/material/dialog';
import { MaterialTooltip } from '../tooltip/tooltip';
import { MaterialDialog } from './dialog';

describe('MaterialDialog', () => {
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
          { path: '', providers: [provideChildTranslateService()], component: MaterialDialog },
          { path: 'other', component: MaterialTooltip },
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

  it('should use route translations, restore focus, select fruit and validate the address', async () => {
    const trigger = button(host, 'Open welcome dialog');
    trigger.focus();
    trigger.click();
    await harness.fixture.whenStable();
    expect(document.querySelector('app-dialog-welcome h2')?.textContent).toContain('Welcome');
    const close = button(document.querySelector('app-dialog-welcome')!, 'Close');
    close.click();
    await harness.fixture.whenStable();
    expect(document.activeElement).toBe(trigger);
    button(host, 'Open fruit dialog').click();
    await harness.fixture.whenStable();
    button(document.querySelector('app-dialog-fruit')!, 'Apple').click();
    await harness.fixture.whenStable();
    expect(host.textContent).toContain('You chose: Apple');
    button(host, 'Open address form').click();
    await harness.fixture.whenStable();
    const address = document.querySelector('app-dialog-address')!;
    const form = address.querySelector('form')!;
    button(address, 'Submit').focus();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    const inputs = Array.from(address.querySelectorAll<HTMLInputElement>('input')).filter(
      input => !input.disabled
    );
    expect(document.activeElement).toBe(inputs[0]);
    const values = ['Pat', 'Doe', '42 Demo Street', '', 'Demo City', 'Demo Region', '12345'];
    inputs.forEach((input, index) => {
      input.value = values[index];
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await harness.fixture.whenStable();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    expect(document.querySelector('app-dialog-address')).toBeNull();
    expect(host.textContent).toContain('Address submitted for this demo.');
  });

  it('should stack local article content and close both dialogs when leaving the page', async () => {
    button(host, 'Learn about Neptune').click();
    await harness.fixture.whenStable();
    button(document.querySelector('app-dialog-neptune')!, 'Open stacked dialog').click();
    await harness.fixture.whenStable();
    expect(document.querySelectorAll('app-dialog-neptune')).toHaveLength(2);
    expect(document.querySelector('iframe')).toBeNull();
    await harness.navigateByUrl('/other');
    await harness.fixture.whenStable();
    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0);
  });
});
