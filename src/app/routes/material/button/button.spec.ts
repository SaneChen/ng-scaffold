/**
 * Behavior tests for MaterialButton, replacing the generated creation test.
 * Checks accessible actions or progress semantics with the real English demo dictionary.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialButton } from './button';

describe('MaterialButton', () => {
  it('should support its demo interaction and accessible state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialButton);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const controls = host.querySelectorAll<HTMLButtonElement>('section:first-child button');
    for (const button of controls) {
      button.click();
    }
    await fixture.whenStable();
    expect(host.querySelector('[role="status"]')?.textContent).toContain('8');
    expect(host.querySelector<HTMLButtonElement>('button[disabled]')?.disabled).toBe(true);
    expect(
      Array.from(host.querySelectorAll('mat-card a'), link => link.getAttribute('href'))
    ).toEqual(['/dashboard', '/dashboard', '/dashboard']);
  });
});
