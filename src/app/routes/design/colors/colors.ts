/**
 * Colors demo (`/design/colors`): the tones of the twelve Material 3 palettes behind the
 * `bg-<palette>-<tone>` / `text-<palette>-<tone>` utilities.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/design/colors` generated the component, template, styles and
 *      spec; the class was renamed `DesignColors`.
 *   2. One card per palette with a swatch per tone, each painted by its own utility class; the
 *      hex codes are read back from the rendered swatches (`afterNextRender`), so the page shows
 *      what the stylesheet really contains.
 *
 * Why: ng-matero listed hex codes copied by hand from the M3 palettes, which could drift from the
 * installed Angular Material; its labels were untranslated palette keys.
 */
import { afterNextRender, Component, ElementRef, inject, signal } from '@angular/core';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';

/** The palettes and tones of src/styles/colors/_index.scss (`$palettes`, `$tones`). */
export const PALETTES = [
  'red',
  'green',
  'blue',
  'yellow',
  'cyan',
  'magenta',
  'orange',
  'chartreuse',
  'spring-green',
  'azure',
  'violet',
  'rose',
] as const;
export const TONES = [10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99] as const;

@Component({
  imports: [PageHeader, TranslatePipe],
  selector: 'app-design-colors',
  styleUrl: './colors.scss',
  templateUrl: './colors.html',
})
export class DesignColors {
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly palettes = PALETTES;
  protected readonly tones = TONES;

  /** Hex code per swatch (`red-40` → `#c00100`), read from the rendered styles. */
  protected readonly hex = signal<Record<string, string>>({});

  constructor() {
    afterNextRender(() => {
      const view = this.#host.ownerDocument.defaultView;
      const codes: Record<string, string> = {};
      for (const swatch of this.#host.querySelectorAll<HTMLElement>('[data-color]')) {
        const color = view?.getComputedStyle(swatch).backgroundColor ?? '';
        codes[swatch.dataset['color'] ?? ''] = toHex(color);
      }
      this.hex.set(codes);
    });
  }

  /** Text color with at least 4.5:1 contrast on the tone (as for the menu tags). */
  protected textClass(tone: number): string {
    return tone < 50 ? 'text-white' : 'text-black';
  }
}

/** `rgb(192, 1, 0)` → `#c00100`; anything else is returned unchanged. */
export function toHex(color: string): string {
  const channels = color.match(/\d+(\.\d+)?/g);
  if (!color.startsWith('rgb') || !channels || channels.length < 3) {
    return color;
  }
  return (
    '#' +
    channels
      .slice(0, 3)
      .map(channel => Math.round(Number(channel)).toString(16).padStart(2, '0'))
      .join('')
  );
}
