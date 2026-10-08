/**
 * Unit tests for `MaterialRadio`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/radio` generated the "should create" test.
 *   2. Replaced it with tests of the bound group (initial value, a new choice echoed), the
 *      labelled groups and the disabled button.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { MaterialRadio } from './radio';

describe('MaterialRadio', () => {
  let fixture: ComponentFixture<MaterialRadio>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      demo: {
        material: {
          selected: 'Selected: {{value}}',
          radio: { seasons: { spring: 'Spring', autumn: 'Autumn' } },
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(MaterialRadio);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should select the bound season and echo a new one', async () => {
    const seasons = Array.from(
      host.querySelectorAll<HTMLInputElement>('mat-radio-group')[0].querySelectorAll('input')
    );
    expect(seasons.map(season => season.checked)).toEqual([false, false, false, true]);
    expect(host.querySelector('mat-card p')?.textContent?.trim()).toBe('Selected: Autumn');

    seasons[1].click();
    await fixture.whenStable();

    expect(host.querySelector('mat-card p')?.textContent?.trim()).toBe('Selected: Spring');
  });

  it('should label every group and disable Maybe', () => {
    const groups = Array.from(host.querySelectorAll('mat-radio-group'));

    expect(
      groups.every(group => host.querySelector(`#${group.getAttribute('aria-labelledby')}`))
    ).toBe(true);
    expect(groups[2].querySelectorAll('input')[2].disabled).toBe(true);
  });
});
