/**
 * Unit tests for `MaterialSlideToggle`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/slide-toggle` generated the "should create" test.
 *   2. Replaced it with tests of the terms form: an invalid submit shows the error and focuses
 *      the toggle, a valid one confirms in a toast.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Toaster } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialSlideToggle } from './slide-toggle';

describe('MaterialSlideToggle', () => {
  let fixture: ComponentFixture<MaterialSlideToggle>;
  let host: HTMLElement;
  const success = vi.fn();

  function terms(): HTMLButtonElement {
    return host.querySelector('form mat-slide-toggle button') as HTMLButtonElement;
  }

  async function submit(): Promise<void> {
    host.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    success.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: Toaster, useValue: { success } },
      ],
    });
    fixture = TestBed.createComponent(MaterialSlideToggle);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should ask for the terms and focus their toggle', async () => {
    await submit();

    expect(host.querySelector('#terms-error')?.textContent?.trim()).toBe(
      'demo.material.slide_toggle.terms.required'
    );
    expect(document.activeElement).toBe(terms());
    expect(terms().getAttribute('aria-describedby')).toBe('terms-error');
    expect(success).not.toHaveBeenCalled();
  });

  it('should confirm accepted terms', async () => {
    terms().click();
    await fixture.whenStable();

    await submit();

    expect(host.querySelector('#terms-error')).toBeNull();
    expect(success).toHaveBeenCalledWith('demo.material.slide_toggle.terms.accepted');
  });
});
