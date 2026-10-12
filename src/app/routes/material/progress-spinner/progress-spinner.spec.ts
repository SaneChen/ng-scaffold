/**
 * Behavior tests for MaterialProgressSpinner, replacing the generated creation test.
 * Checks accessible actions or progress semantics with the real English demo dictionary.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialProgressSpinner } from './progress-spinner';

describe('MaterialProgressSpinner', () => {
  it('should support its demo interaction and accessible state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialProgressSpinner);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.value = '85';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    const progress = host.querySelectorAll('[role="progressbar"]');
    expect(progress[0].getAttribute('aria-valuenow')).toBe('85');
    expect(progress[1].hasAttribute('aria-valuenow')).toBe(false);
  });
});
