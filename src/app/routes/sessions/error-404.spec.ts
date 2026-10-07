/**
 * Unit tests for `Error404`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/error-404 --flat --inline-template --inline-style`
 *      generated the "should create" test.
 *   2. Replaced it with a test of the code and the translated texts it shows.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Error404 } from './error-404';

describe('Error404', () => {
  it('should show the code with its translated title and message', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    TestBed.inject(TranslateService).setTranslation('en', {
      error: { 404: { title: 'Title 404', message: 'Message 404' } },
    });
    TestBed.inject(TranslateService).use('en');
    const fixture = TestBed.createComponent(Error404);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '404 Title 404'
    );
    expect(host.querySelector('p')?.textContent).toBe('Message 404');
  });
});
