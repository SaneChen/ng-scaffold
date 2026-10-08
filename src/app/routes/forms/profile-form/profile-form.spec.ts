/**
 * Unit tests for `ProfileForm`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/profile-form` generated the "should create" test.
 *   2. Replaced it with tests through the rendered form: required and email errors with focus
 *      on the first invalid field, a valid submit and its toast, Cancel restoring the empty form,
 *      a typed date parsed by the demo date adapter, and the two-column layout.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toaster } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideDemoDates } from '../../demo/demo-dates';
import { ProfileForm } from './profile-form';

describe('ProfileForm', () => {
  let fixture: ComponentFixture<ProfileForm>;
  const success = vi.fn();

  function input(autocomplete: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[autocomplete="${autocomplete}"]`);
  }

  async function type(field: HTMLInputElement, value: string): Promise<void> {
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function click(selector: string): Promise<void> {
    fixture.nativeElement.querySelector(selector).click();
    await fixture.whenStable();
  }

  function errors(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('mat-error')).map(
      error => error.textContent?.trim() ?? ''
    );
  }

  beforeEach(async () => {
    success.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideDemoDates(),
        { provide: Toaster, useValue: { success } },
      ],
    });
    fixture = TestBed.createComponent(ProfileForm);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should require the main fields and focus the first one', async () => {
    await type(input('email'), 'nope');
    await click('button[type="submit"]');

    expect(errors()).toEqual([
      'validation.required',
      'validation.required',
      'validation.required',
      'validation.invalid_email',
    ]);
    expect(document.activeElement).toBe(input('username'));
    expect(success).not.toHaveBeenCalled();
  });

  it('should submit a valid form, and empty it on Cancel', async () => {
    await type(input('username'), 'ada');
    await type(input('email'), 'ada@example.com');
    await type(fixture.nativeElement.querySelector('input[type="tel"]'), '123');
    fixture.componentInstance['form'].gender().value.set('female');
    await click('button[type="submit"]');
    expect(success).toHaveBeenCalledWith('demo.forms.saved');

    await click('.actions button[type="button"]');
    expect(input('username').value).toBe('');
  });

  it('should parse a typed date with the demo date adapter', async () => {
    const date: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-haspopup]');
    await type(date, '10/15/2026');

    expect(fixture.componentInstance['model']().date).toEqual(new Date(2026, 9, 15));
  });

  it('should show the date parse error and focus the date instead of silently blocking save', async () => {
    await type(input('username'), 'ada');
    await type(input('email'), 'ada@example.com');
    await type(fixture.nativeElement.querySelector('input[type="tel"]'), '123');
    fixture.componentInstance['form'].gender().value.set('female');
    const date: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-haspopup]');
    await type(date, '10/15/2026');
    await type(date, 'soon');
    const submit: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    submit.focus();
    await click('button[type="submit"]');
    expect(success).not.toHaveBeenCalled();
    expect(errors()).toContain('demo.forms.fields.invalid_date');
    expect(document.activeElement).toBe(date);
  });

  it('should lay the fields out in two columns on request', async () => {
    fixture.componentRef.setInput('columns', 2);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('mat-form-field').classList).toContain('col-sm-6');
  });
});
