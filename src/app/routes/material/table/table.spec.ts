/**
 * Behavior tests for MaterialTable; generated creation test replaced with real data interactions.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialTable } from './table';

describe('MaterialTable', () => {
  it('should update rows or page state through accessible controls', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialTable);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const sections = host.querySelectorAll('section');
    expect(sections[0].querySelectorAll('tbody tr')).toHaveLength(6);
    expect(sections[1].querySelector('tbody td')?.textContent).toContain('Jules');
    sections[1].querySelector<HTMLElement>('th[mat-sort-header]')!.click();
    await fixture.whenStable();
    expect(sections[1].querySelector('tbody td')?.textContent).toContain('Brad');
    expect(sections[2].querySelectorAll('tbody tr')).toHaveLength(3);
    expect(sections[2].querySelector('tbody td')?.textContent).toContain('Austin');
    sections[2].querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click();
    await fixture.whenStable();
    expect(sections[2].querySelector('tbody td')?.textContent).toContain('Tina');
  });
});
