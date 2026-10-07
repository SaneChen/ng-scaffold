/**
 * Unit tests for `Error403`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/error-403 --flat --inline-template --inline-style`
 *      generated the "should create" test.
 *   2. Replaced it with a test of the code and the translated texts it shows.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Error403 } from './error-403';

describe('Error403', () => {
  it('should show the code with its translated title and message', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    TestBed.inject(TranslateService).setTranslation('en', {
      error: { 403: { title: 'Title 403', message: 'Message 403' } },
    });
    TestBed.inject(TranslateService).use('en');
    const fixture = TestBed.createComponent(Error403);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '403 Title 403'
    );
    expect(host.querySelector('p')?.textContent).toBe('Message 403');
  });
});
