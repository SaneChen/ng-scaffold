/**
 * Unit tests for `ErrorCode`.
 *
 * How this file was built:
 *   1. `yarn ng g component shared/error-code --inline-template --inline-style` generated the
 *      "should create" test.
 *   2. Replaced it with tests for the heading (code and title), the optional message and the
 *      translated link to the home page.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ErrorCode } from './error-code';

describe('ErrorCode', () => {
  let fixture: ComponentFixture<ErrorCode>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(ErrorCode);
    fixture.componentRef.setInput('code', '404');
    fixture.componentRef.setInput('heading', 'error.404.title');
    await fixture.whenStable();
  });

  it('should head the page with the code and the title and link home', () => {
    const host: HTMLElement = fixture.nativeElement;
    const link = host.querySelector('a');

    expect(host.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '404 error.404.title'
    );
    expect(host.querySelector('p')).toBeNull();
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent?.trim()).toBe('error.back_home');
  });

  it('should show the message when given', async () => {
    fixture.componentRef.setInput('message', 'error.404.message');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('p').textContent).toBe('error.404.message');
  });
});
