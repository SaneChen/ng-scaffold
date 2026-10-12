/**
 * Behavior tests for MaterialStepper; generated with the component and rewritten to test
 * navigation, validation or keyboard interaction instead of component creation.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MaterialStepper } from './stepper';
import { By } from '@angular/platform-browser';
import { MatStepper } from '@angular/material/stepper';
import { BreakpointObserver } from '@angular/cdk/layout';
import { firstValueFrom, of } from 'rxjs';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import zhCN from '../../../../../public/i18n/demo/zh-CN.json';
import zhTW from '../../../../../public/i18n/demo/zh-TW.json';
describe('MaterialStepper', () => {
  it('should translate hidden editable status and update it after language changes', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false }) } },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    translate.setTranslation('zh-CN', zhCN);
    translate.setTranslation('zh-TW', zhTW);
    await firstValueFrom(translate.use('zh-CN'));
    const fixture = TestBed.createComponent(MaterialStepper);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.value = 'Test Person';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    host.querySelector<HTMLButtonElement>('button[matStepperNext]')!.click();
    await fixture.whenStable();
    const firstHeader = host.querySelector('mat-step-header')!;
    expect(firstHeader.textContent).toContain('可编辑');
    await firstValueFrom(translate.use('zh-TW'));
    await fixture.whenStable();
    expect(firstHeader.textContent).toContain('可編輯');
    await firstValueFrom(translate.use('en-US'));
    await fixture.whenStable();
    expect(firstHeader.textContent).toContain('Editable');
  });
  it('should validate Signal Form steps in linear mode and reset the values and navigation', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false }) } },
      ],
    });
    const fixture = TestBed.createComponent(MaterialStepper);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    host.querySelector<HTMLButtonElement>('button[aria-pressed]')!.click();
    await fixture.whenStable();
    const next = host.querySelector<HTMLButtonElement>('button[matStepperNext]')!;
    next.click();
    await fixture.whenStable();
    expect(stepper.selectedIndex).toBe(0);
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.value = 'Test Person';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    next.click();
    await fixture.whenStable();
    expect(stepper.selectedIndex).toBe(1);
    const address = host.querySelectorAll<HTMLInputElement>('input')[1];
    address.value = '42 Demo Street';
    address.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    host.querySelectorAll<HTMLButtonElement>('button[matStepperNext]')[1].click();
    await fixture.whenStable();
    expect(stepper.selectedIndex).toBe(2);
    const reset = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(button =>
      button.textContent?.includes('demo.material.stepper.reset')
    )!;
    reset.click();
    await fixture.whenStable();
    expect(stepper.selectedIndex).toBe(0);
    expect(Array.from(host.querySelectorAll('input'), element => element.value)).toEqual(['', '']);
    next.click();
    await fixture.whenStable();
    expect(stepper.selectedIndex).toBe(0);
  });
});
