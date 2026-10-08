/**
 * Unit tests for `DesignColors`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/design/colors` generated the "should create" test.
 *   2. Replaced it with tests of the swatches (one per palette and tone, painted by their utility
 *      class, readable text color), of the hex codes read back from the styles, and of `toHex()`.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { DesignColors, PALETTES, toHex, TONES } from './colors';

describe('DesignColors', () => {
  it('should paint one swatch per palette and tone with readable text', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(DesignColors);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const swatches = host.querySelectorAll('[data-color]');

    expect(host.querySelectorAll('h2')).toHaveLength(PALETTES.length);
    expect(swatches).toHaveLength(PALETTES.length * TONES.length);
    expect(host.querySelector('[data-color="red-40"]')?.className).toBe('bg-red-40 text-white');
    expect(host.querySelector('[data-color="red-50"]')?.className).toBe('bg-red-50 text-black');
  });

  it('should show the colors as hex codes', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const style = document.head.appendChild(document.createElement('style'));
    style.textContent = '.bg-blue-40 { background-color: rgb(52, 61, 255); }';
    const fixture = TestBed.createComponent(DesignColors);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-color="blue-40"] code').textContent).toBe(
      '#343dff'
    );
    style.remove();
  });

  it('should convert rgb() colors and leave others alone', () => {
    expect(toHex('rgb(192, 1, 0)')).toBe('#c00100');
    expect(toHex('rgba(0, 0, 0, 0.5)')).toBe('#000000');
    expect(toHex('transparent')).toBe('transparent');
  });
});
