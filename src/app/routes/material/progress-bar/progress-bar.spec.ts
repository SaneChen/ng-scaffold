/**
 * Behavior tests for MaterialProgressBar, replacing the generated creation test.
 * Checks accessible actions or progress semantics with the real English demo dictionary.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialProgressBar } from './progress-bar';

describe('MaterialProgressBar', () => {
  it('should support its demo interaction and accessible state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialProgressBar);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const progress = host.querySelectorAll('[role="progressbar"]');
    expect(progress).toHaveLength(4);
    expect(progress[0].getAttribute('aria-valuenow')).toBe('40');
    expect(progress[1].getAttribute('aria-valuenow')).toBe('40');
    expect(progress[2].hasAttribute('aria-valuenow')).toBe(false);
    expect(progress[3].hasAttribute('aria-valuenow')).toBe(false);
    expect(Array.from(progress, element => element.getAttribute('aria-label'))).toEqual([
      'Survey progress',
      'Video playback and buffer',
      'Loading content',
      'Searching',
    ]);
  });
});
