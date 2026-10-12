/**
 * Behavior tests for MaterialButtonToggle, replacing the generated creation test.
 * Checks accessible actions or progress semantics with the real English demo dictionary.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialButtonToggle } from './button-toggle';

describe('MaterialButtonToggle', () => {
  it('should support its demo interaction and accessible state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialButtonToggle);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const groups = host.querySelectorAll('mat-button-toggle-group');
    const pies = groups[2].querySelectorAll<HTMLButtonElement>('button');
    pies[1].click();
    await fixture.whenStable();
    expect(host.querySelector('[role="status"]')?.textContent).toContain('Cherry');
    expect(pies[1].getAttribute('aria-checked')).toBe('true');
    expect(pies[0].getAttribute('aria-checked')).toBe('false');
    expect(Array.from(groups[3].querySelectorAll('button'), button => button.disabled)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});
