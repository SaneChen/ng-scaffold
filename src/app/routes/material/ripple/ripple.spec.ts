/**
 * Behavior tests for MaterialRipple, replacing the generated creation test.
 * Checks accessible actions or progress semantics with the real English demo dictionary.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { By } from '@angular/platform-browser';
import { MatRipple } from '@angular/material/core';
import { MaterialRipple } from './ripple';

describe('MaterialRipple', () => {
  it('should support its demo interaction and accessible state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialRipple);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const ripple = fixture.debugElement.query(By.css('.target')).injector.get(MatRipple);
    const launch = vi.spyOn(ripple, 'launch');
    host.querySelector<HTMLButtonElement>('.target')!.click();
    expect(launch).toHaveBeenCalledOnce();
    host.querySelectorAll<HTMLInputElement>('mat-checkbox input')[1].click();
    await fixture.whenStable();
    expect(ripple.disabled).toBe(true);
    host.querySelector<HTMLButtonElement>('.target')!.click();
    expect(launch).toHaveBeenCalledOnce();
  });
});
