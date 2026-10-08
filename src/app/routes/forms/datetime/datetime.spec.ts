/**
 * Unit tests for `FormsDatetime`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/datetime` generated the "should create" test.
 *   2. Replaced it with tests through the rendered pickers, at a fixed system time: the
 *      translated labels and initial values, the limits handed to the picker, the hints
 *      formatted in the language's locale, and the translated limit and parse errors.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SettingsStore } from '@core';
import {
  MtxDatetimepickerInput,
  MtxDatetimepickerFilterType,
} from '@ng-matero/extensions/datetimepicker';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { provideDemoDatetimes } from '../../demo/demo-datetimes';
import { EXAMPLES, FormsDatetime } from './datetime';

describe('FormsDatetime', () => {
  it('should interpret even months as human calendar months, not zero-based indexes', () => {
    const filter = EXAMPLES.find(example => example.name === 'filter')!.filter;
    expect(filter(new Date(2026, 0, 2, 10, 10), MtxDatetimepickerFilterType.DATE)).toBe(false);
    expect(filter(new Date(2026, 1, 2, 10, 10), MtxDatetimepickerFilterType.DATE)).toBe(true);
    expect(filter(new Date(2026, 1, 3, 10, 10), MtxDatetimepickerFilterType.DATE)).toBe(false);
    expect(filter(new Date(2026, 1, 2, 11, 10), MtxDatetimepickerFilterType.HOUR)).toBe(false);
    expect(filter(new Date(2026, 1, 2, 10, 11), MtxDatetimepickerFilterType.MINUTE)).toBe(false);
  });
  const NOW = new Date(2026, 9, 7, 10, 52, 30);
  let fixture: ComponentFixture<FormsDatetime>;
  let host: HTMLElement;

  function fields(): HTMLElement[] {
    return Array.from(host.querySelectorAll('mat-form-field'));
  }

  function subscript(index: number): string | undefined {
    const field = fields()[index];
    return (
      field.querySelector('mat-error') ?? field.querySelector('mat-hint')
    )?.textContent?.trim();
  }

  async function type(index: number, text: string): Promise<void> {
    const input = fields()[index].querySelector('input');
    if (!input) throw new Error(`No input in field ${index}`);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), provideDemoDatetimes()],
    });
    const datetime = {
      fields: { datetime: 'Date and time', touch: 'Touch' },
      hints: { soon: 'From {{min}} to {{max}}' },
      errors: { min: 'Too early', parse: 'Not a date' },
    };
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', { demo: { forms: { datetime } } });
    translate.setTranslation('zh-CN', { demo: { forms: { datetime } } });
    fixture = TestBed.createComponent(FormsDatetime);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should render every picker with its translated label', () => {
    const labels = fields().map(field => field.querySelector('mat-label')?.textContent?.trim());

    expect(labels).toHaveLength(EXAMPLES.length);
    expect(labels[0]).toBe('Date and time');
    expect(labels.at(-1)).toBe('Touch');
  });

  it('should start at the current minute, limited to the next day', () => {
    const picker = fixture.debugElement
      .queryAll(el => el.injector.get(MtxDatetimepickerInput, null) !== null)
      .map(el => el.injector.get(MtxDatetimepickerInput<Date>))[0];

    expect(fields()[0].querySelector('input')?.value).toBe('10/07/2026 10:52 AM');
    expect(picker.min).toEqual(new Date(2026, 9, 7, 10, 52));
    expect(picker.max).toEqual(new Date(2026, 9, 8, 10, 52));
    expect(subscript(0)).toBe('From Oct 7, 2026, 10:52 AM to Oct 8, 2026, 10:52 AM');
  });

  it('should format the hints in the locale of the language', async () => {
    TestBed.inject(SettingsStore).update({ language: 'zh-CN' });
    await fixture.whenStable();

    const at = (date: Date) => format(date, 'PPp', { locale: zhCN });
    expect(subscript(0)).toBe(
      `From ${at(new Date(2026, 9, 7, 10, 52))} to ${at(new Date(2026, 9, 8, 10, 52))}`
    );
  });

  it('should translate the limit errors', async () => {
    await type(0, '01/01/2020 10:00 AM');

    expect(subscript(0)).toBe('Too early');
  });

  it('should translate the parse error of text that is not a date', async () => {
    await type(0, 'soon');

    expect(subscript(0)).toBe('Not a date');
  });
});
