/**
 * Unit tests for `MaterialDatepicker`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/datepicker` generated the "should create" test.
 *   2. Replaced it with tests at a fixed date, with the demo date providers: the weekday filter,
 *      the limits handed to the inputs (the return follows the departure) and the translated
 *      error of each field.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideDemoDates } from '../../demo/demo-dates';
import { MaterialDatepicker, weekdaysOnly } from './datepicker';

describe('MaterialDatepicker', () => {
  let fixture: ComponentFixture<MaterialDatepicker>;

  function field(index: number): HTMLElement {
    return fixture.nativeElement.querySelectorAll('mat-form-field')[index];
  }

  async function type(index: number, text: string): Promise<void> {
    const input = field(index).querySelector('input') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  function error(index: number): string | undefined {
    return field(index).querySelector('mat-error')?.textContent?.trim();
  }

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), provideDemoDates()],
    });
    fixture = TestBed.createComponent(MaterialDatepicker);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should allow weekdays only', () => {
    expect(weekdaysOnly(new Date(2026, 9, 9))).toBe(true);
    expect(weekdaysOnly(new Date(2026, 9, 10))).toBe(false);
    expect(weekdaysOnly(null)).toBe(true);
  });

  it('should refuse a birthday in the future', async () => {
    await type(0, '10/08/2027');

    expect(error(0)).toBe('demo.material.datepicker.errors.earlier');
  });

  it('should ask for a payment date', async () => {
    await type(1, '');

    expect(error(1)).toBe('demo.material.datepicker.errors.choose');
  });

  it('should start the return at the departure', async () => {
    const returnInput = field(3).querySelector('input') as HTMLInputElement;
    expect(returnInput.getAttribute('min')).toBe('2026-10-07');

    await type(2, '11/20/2026');
    await type(3, '11/10/2026');

    expect(returnInput.getAttribute('min')).toBe('2026-11-20');
    expect(error(3)).toBe('demo.material.datepicker.errors.after_departure');
  });

  it('should refuse an appointment on a weekend', async () => {
    await type(4, '10/10/2026');

    expect(error(4)).toBe('demo.material.datepicker.errors.unavailable');
  });
});
