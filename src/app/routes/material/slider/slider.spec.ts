/**
 * Unit tests for `MaterialSlider`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/slider` generated the "should create" test.
 *   2. Replaced it with tests of the thumb label format, the swatch following the channels and
 *      the labelled thumbs.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialSlider, thousands } from './slider';

describe('MaterialSlider', () => {
  let fixture: ComponentFixture<MaterialSlider>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(MaterialSlider);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should format thousands', () => {
    expect(thousands(999)).toBe('999');
    expect(thousands(12_400)).toBe('12k');
  });

  it('should paint the swatch with the channels', async () => {
    const red = host.querySelector<HTMLInputElement>('#slider-red');
    if (!red) throw new Error('No red thumb');

    red.value = '255';
    red.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(host.querySelector('.swatch')?.getAttribute('aria-label')).toBe('rgb(255 80 164)');
  });

  it('should label every thumb', () => {
    const thumbs = Array.from(host.querySelectorAll('input'));

    expect(thumbs).toHaveLength(7);
    for (const thumb of thumbs) {
      const labelled =
        thumb.getAttribute('aria-label') ||
        thumb.getAttribute('aria-labelledby') ||
        host.querySelector(`label[for="${thumb.id}"]`);
      expect(labelled).toBeTruthy();
    }
  });
});
