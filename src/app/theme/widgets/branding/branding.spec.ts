/**
 * Unit tests for `Branding`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/branding --inline-template --inline-style` generated the
 *      "should create" test.
 *   2. Replaced it with tests for the name taken from `PageTitleStrategy` and for the link's
 *      accessible name when only the logo is shown.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PageTitleStrategy } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { Branding } from './branding';

describe('Branding', () => {
  let fixture: ComponentFixture<Branding>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    TestBed.inject(PageTitleStrategy).setAppName('Acme Admin');
    fixture = TestBed.createComponent(Branding);
    await fixture.whenStable();
  });

  it('should link the logo and the application name to the home page', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.getAttribute('href')).toBe('/');
    expect(link.textContent?.trim()).toBe('Acme Admin');
    expect(link.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('should name the link after the application when the name is hidden', async () => {
    fixture.componentRef.setInput('showName', false);
    await fixture.whenStable();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.textContent?.trim()).toBe('');
    expect(link.getAttribute('aria-label')).toBe('Acme Admin');
  });
});
