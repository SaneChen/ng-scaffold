/**
 * Behavior tests for MaterialSort; generated creation test replaced with real data interactions.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialSort } from './sort';

describe('MaterialSort', () => {
  it('should update rows or page state through accessible controls', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialSort);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const header = host.querySelectorAll<HTMLElement>('thead th')[2];
    header.click();
    await fixture.whenStable();
    expect(host.querySelector('tbody th')?.textContent).toContain('Cupcake');
    expect(host.querySelector('[role="status"]')?.textContent).toContain('Fat (g), ascending');
    header.click();
    await fixture.whenStable();
    expect(host.querySelector('tbody th')?.textContent).toContain('Éclair');
    header.click();
    await fixture.whenStable();
    expect(host.querySelector('tbody th')?.textContent).toContain('Frozen yogurt');
  });
});
