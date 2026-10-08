/**
 * Unit tests for `FormsDynamic` with the formly configuration of the forms demo.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/dynamic` generated the "should create" test.
 *   2. Replaced it with tests through the rendered formly forms: translated labels, the field
 *      enabled by another one, translated validation messages, a valid submit and its toast,
 *      and the custom combobox type with translated options.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Toaster } from '@core';
import { MtxSelect } from '@ng-matero/extensions/select';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideDemoSelect } from '../../demo/demo-select';
import { provideDemoFormly } from '../demo-formly';
import { FormsDynamic } from './dynamic';

describe('FormsDynamic', () => {
  let fixture: ComponentFixture<FormsDynamic>;
  let simple: HTMLElement;
  const success = vi.fn();

  function inputs(): HTMLInputElement[] {
    return Array.from(simple.querySelectorAll('input'));
  }

  async function type(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    success.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        provideDemoSelect(),
        provideDemoFormly(),
        { provide: Toaster, useValue: { success } },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      validation: { required: 'Required', invalid_email: 'Invalid email' },
      demo: {
        forms: {
          dynamic: {
            fields: { text: 'Text', email: 'Email address' },
            cities: { beijing: 'Beijing', shanghai: 'Shanghai' },
          },
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(FormsDynamic);
    await fixture.whenStable();
    simple = fixture.nativeElement.querySelector('mat-card form');
  });

  it('should label the fields from the translations', () => {
    const labels = Array.from(simple.querySelectorAll('mat-label'), label =>
      label.textContent?.trim()
    );

    expect(labels[0]).toBe('Text *');
    expect(labels[2]).toBe('Email address *');
  });

  it('should enable the second field once the first one has text', async () => {
    expect(inputs()[1].disabled).toBe(true);

    await type(inputs()[0], 'hello');

    expect(inputs()[1].disabled).toBe(false);
  });

  it('should validate before submitting and show the model in a toast', async () => {
    simple.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await fixture.whenStable();
    expect(simple.querySelector('mat-error')?.textContent?.trim()).toBe('Required');
    expect(success).not.toHaveBeenCalled();

    await type(inputs()[0], 'hello');
    simple.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await fixture.whenStable();
    expect(success).toHaveBeenCalledWith(expect.stringContaining('"text":"hello"'));
  });

  it('should offer the translated cities in the combobox', () => {
    const select = fixture.debugElement
      .queryAll(el => el.componentInstance instanceof MtxSelect)
      .map(el => el.componentInstance as MtxSelect)[0];

    expect(select.items?.slice(0, 2)).toEqual([
      { id: 1, name: 'Beijing' },
      { id: 2, name: 'Shanghai' },
    ]);
  });

  it('should reject an invalid email rather than treating the HTML input type as validation', async () => {
    await type(inputs()[0], 'hello');
    await type(inputs()[2], 'not-an-email');
    simple.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    expect(success).not.toHaveBeenCalled();
    expect(simple.querySelector('mat-error')?.textContent).toContain('Invalid email');
    await type(inputs()[2], 'person@example.com');
    simple.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    expect(success).toHaveBeenCalledWith(expect.stringContaining('person@example.com'));
  });
});
