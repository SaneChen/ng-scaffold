/**
 * Content reused by the three lazy weather routes.
 * How this file was built: `yarn ng g component routes/material/tab/weather --flat
 * --inline-template --inline-style`, then derived translated content from route data.
 * Why: weather content follows the data of its activated route.
 */
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

@Component({
  imports: [TranslatePipe],
  selector: 'app-material-weather',
  template: `
    <p>{{ 'demo.material.tab.' + weather() + '.text' | translate }}</p>
  `,
})
export class MaterialWeather {
  protected readonly weather = toSignal(
    inject(ActivatedRoute).data.pipe(
      map(data => {
        const weather: unknown = data['weather'];
        return weather === 'rainy' || weather === 'foggy' ? weather : 'sunny';
      })
    ),
    { initialValue: 'sunny' }
  );
}
