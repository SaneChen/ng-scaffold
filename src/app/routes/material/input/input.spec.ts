/**
 * Unit tests for `MaterialInput`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/input` generated the "should create" test.
 *   2. Replaced it with tests of the password reveal button, the email errors, the currency
 *      conversion both ways and the comment's limit and count.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { COMMENT_MAX, MaterialInput, USD_TO_JPY } from './input';

describe('MaterialInput', () => {
  let fixture: ComponentFixture<MaterialInput>;
  let host: HTMLElement;

  function input(selector: string): HTMLInputElement {
    const found = host.querySelector<HTMLInputElement>(selector);
    if (!found) throw new Error(`No ${selector}`);
    return found;
  }

  async function type(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string
  ): Promise<void> {
    element.value = text;
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(MaterialInput);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should reveal and hide the password', async () => {
    const password = input('input[autocomplete="new-password"]');
    const toggle = password.closest('mat-form-field')?.querySelector('button');
    expect(password.type).toBe('password');
    expect(toggle?.getAttribute('aria-label')).toBe('demo.material.input.password.show');

    toggle?.click();
    await fixture.whenStable();

    expect(password.type).toBe('text');
    expect(toggle?.getAttribute('aria-label')).toBe('demo.material.input.password.hide');
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should explain an invalid email', async () => {
    const email = input('input[type="email"]');

    await type(email, 'nobody');

    expect(email.closest('mat-form-field')?.querySelector('mat-error')?.textContent?.trim()).toBe(
      'validation.invalid_email'
    );
  });

  it('should convert between dollars and yen', async () => {
    const [usd, jpy] = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="number"]'));

    await type(usd, '10');
    expect(jpy.value).toBe(String(Math.round(10 * USD_TO_JPY * 100) / 100));

    await type(jpy, '220.58');
    expect(usd.value).toBe('2');

    await type(jpy, '');
    expect(usd.value).toBe('');
  });

  it('should limit and count the comment', async () => {
    const comment = host.querySelector('textarea') as HTMLTextAreaElement;

    await type(comment, 'Hello');

    expect(comment.getAttribute('maxlength')).toBe(String(COMMENT_MAX));
    expect(
      comment.closest('mat-form-field')?.querySelectorAll('mat-hint')[1]?.textContent?.trim()
    ).toBe(`5 / ${COMMENT_MAX}`);
  });
});
