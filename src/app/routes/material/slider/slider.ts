/**
 * Slider demo (`/material/slider`): `mat-slider` choosing a colour, rating with tick marks,
 * formatting its thumb label and selecting a range.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/slider` generated the component, template, styles and
 *      spec; the class was renamed `MaterialSlider`.
 *   2. One Signal Form holds every thumb (`matSliderThumb` is a form control); the swatch colour
 *      is `computed()` from the three channels.
 *   3. Each thumb input is labelled (the label of a `mat-slider` element does not reach it).
 *
 * Why: ng-matero used `ngModel`, a getter and labels on the slider instead of its thumbs.
 */
import { Component, computed, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

/** "12k" for thousands. */
export function thousands(value: number): string {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
}

@Component({
  imports: [FormField, MatCardModule, MatSliderModule, PageHeader, TranslatePipe],
  selector: 'app-material-slider',
  styleUrl: './slider.scss',
  templateUrl: './slider.html',
})
export class MaterialSlider {
  protected readonly channels = ['red', 'green', 'blue'] as const;
  protected readonly thousands = thousands;

  protected readonly values = signal({
    red: 103,
    green: 80,
    blue: 164,
    rating: 3,
    budget: 40000,
    from: 300,
    to: 400,
  });
  protected readonly form = form(this.values);

  protected readonly swatch = computed(() => {
    const { red, green, blue } = this.values();
    return `rgb(${red} ${green} ${blue})`;
  });
}
