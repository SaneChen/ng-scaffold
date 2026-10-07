/**
 * Unit tests for `Error500`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/error-500 --flat --inline-template --inline-style`
 *      generated the "should create" test.
 *   2. Replaced it with a test of the code and the translated texts it shows.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Error500 } from './error-500';

describe('Error500', () => {
  it('should show the code with its translated title and message', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    TestBed.inject(TranslateService).setTranslation('en', {
      error: { 500: { title: 'Title 500', message: 'Message 500' } },
    });
    TestBed.inject(TranslateService).use('en');
    const fixture = TestBed.createComponent(Error500);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '500 Title 500'
    );
    expect(host.querySelector('p')?.textContent).toBe('Message 500');
  });
});
