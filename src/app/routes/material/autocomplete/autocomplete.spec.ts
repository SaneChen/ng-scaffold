/**
 * Unit tests for `MaterialAutocomplete` and its states.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/autocomplete` generated the "should create" test.
 *   2. Replaced it with tests of the filtering and grouping (states.ts) and of the options shown
 *      while typing, with the typed value echoed.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialAutocomplete } from './autocomplete';
import { filterStates, groupStates, STATES } from './states';

describe('states', () => {
  it('should filter by any part of the name, ignoring case', () => {
    expect(filterStates(' NEW ')).toEqual([
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
    ]);
    expect(filterStates('')).toEqual(STATES);
  });

  it('should group the matches by first letter', () => {
    expect(groupStates('dakota')).toEqual([
      { letter: 'N', names: ['North Dakota'] },
      { letter: 'S', names: ['South Dakota'] },
    ]);
  });
});

describe('MaterialAutocomplete', () => {
  let fixture: ComponentFixture<MaterialAutocomplete>;

  async function type(index: number, text: string): Promise<HTMLInputElement> {
    const input = fixture.nativeElement.querySelectorAll('input')[index] as HTMLInputElement;
    input.focus();
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    return input;
  }

  function options(): string[] {
    return Array.from(
      document.querySelectorAll('mat-option'),
      option => option.textContent?.trim() ?? ''
    );
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(MaterialAutocomplete);
    await fixture.whenStable();
  });

  it('should offer the matching states', async () => {
    await type(0, 'new');

    expect(options()).toEqual(['New Hampshire', 'New Jersey', 'New Mexico', 'New York']);
  });

  it('should offer the matching states in groups', async () => {
    await type(1, 'dakota');

    const labels = Array.from(document.querySelectorAll('mat-optgroup'), group =>
      group.querySelector('.mat-mdc-optgroup-label')?.textContent?.trim()
    );
    expect(labels).toEqual(['N', 'S']);
    expect(options()).toEqual(['North Dakota', 'South Dakota']);
  });
});
