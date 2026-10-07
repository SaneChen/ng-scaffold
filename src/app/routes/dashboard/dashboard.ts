/**
 * The dashboard (`/dashboard`): statistics, two charts, a table and a message list.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/dashboard` generated the component, template, styles and spec.
 *   2. Statistics cards (tone-40 backgrounds with white text, `MatProgressBar` instead of
 *      `mtx-progress`), a `mat-table` and a `mat-list` with letter avatars, from ./data.
 *   3. Charts: `afterNextRender` loads ./charts (Chart.js) on demand through `CHARTS_LOADER`
 *      (replaceable in tests); an `afterRenderEffect` (re)creates both charts whenever the module
 *      arrives or the theme, the language or the translations change. Colors are resolved from `--mat-sys-*` tokens through a probe element
 *      (they are `light-dark()` values), labels are translated and dates/numbers are formatted
 *      with `Intl` in the current language (also the charts' own numbers), the time axis and
 *      legends follow the text direction, animations follow `prefers-reduced-motion`. Each
 *      canvas is an image with a translated description, followed by a visually hidden table of
 *      its values for screen readers.
 *
 * Why: ng-matero created the ApexCharts instances outside Angular by `document.querySelector`
 * ids, recolored them from a settings `Subject` with hard-coded light/dark colors and showed
 * untranslated titles. Here every input of the charts is a signal.
 */
import { MediaMatcher } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  InjectionToken,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { LanguageStore, SettingsStore } from '@core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Chart, ChartColors } from './charts';
import { ELEMENTS, MESSAGES, STATS, TRAFFIC, WEEKLY_REVENUE } from './data';

export type ChartsModule = typeof import('./charts');

/** Loads ./charts on demand; tests replace it (jsdom has no canvas). */
export const CHARTS_LOADER = new InjectionToken<() => Promise<ChartsModule>>('CHARTS_LOADER', {
  factory: () => () => import('./charts'),
});

/** Translation keys of the chart labels. */
const CHART_KEYS = ['dashboard.views', 'dashboard.downloads', 'dashboard.weekly_revenue'];

/** 2019-11-24 was a Sunday: the first day of `WEEKLY_REVENUE`. */
const SUNDAY = '2019-11-24T12:00:00';

@Component({
  imports: [MatCardModule, MatListModule, MatProgressBarModule, MatTableModule, TranslatePipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly #document = inject(DOCUMENT);
  readonly #media = inject(MediaMatcher);
  readonly #settings = inject(SettingsStore);
  readonly #language = inject(LanguageStore);

  protected readonly stats = STATS;
  protected readonly elements = ELEMENTS;
  protected readonly messages = MESSAGES;
  protected readonly columns = ['position', 'name', 'weight', 'symbol'];

  /** Number format of the current language (up to the 4 decimals of the atomic weights). */
  protected readonly numbers = computed(
    () => new Intl.NumberFormat(this.#language.current(), { maximumFractionDigits: 4 })
  );

  /** X-axis labels of the traffic chart: times in the current language. */
  protected readonly times = computed(() => {
    const time = new Intl.DateTimeFormat(this.#language.current(), {
      hour: 'numeric',
      minute: '2-digit',
    });
    return TRAFFIC.times.map(iso => time.format(new Date(iso)));
  });

  /** Axes of the revenue chart: weekdays in the current language, from Sunday. */
  protected readonly days = computed(() => {
    const weekday = new Intl.DateTimeFormat(this.#language.current(), { weekday: 'long' });
    const sunday = new Date(SUNDAY);
    return WEEKLY_REVENUE.map((_, i) =>
      weekday.format(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i))
    );
  });

  protected readonly trafficData = TRAFFIC;
  protected readonly weeklyRevenue = WEEKLY_REVENUE;

  readonly #labels = toSignal(inject(TranslateService).stream(CHART_KEYS), {
    initialValue: {} as Record<string, string>,
  });

  readonly #module = signal<ChartsModule | undefined>(undefined);
  private readonly trafficCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('traffic');
  private readonly revenueCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('revenue');
  private readonly probe = viewChild.required<ElementRef<HTMLElement>>('probe');
  #charts: Chart[] = [];

  constructor() {
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      this.#destroyCharts();
    });

    const load = inject(CHARTS_LOADER);
    afterNextRender(async () => {
      const charts = await load();
      if (!destroyed) {
        this.#module.set(charts);
      }
    });

    afterRenderEffect(() => {
      const charts = this.#module();
      const settings = {
        locale: this.#language.current(),
        rtl: this.#settings.options().dir === 'rtl',
      };
      const labels = this.#labels();
      const times = this.times();
      const days = this.days();
      // The colors are read from the DOM (#colors); this signal tells when the theme changed.
      this.#settings.themeColor();
      if (charts) {
        this.#drawCharts(charts, { ...settings, times, days }, labels);
      }
    });
  }

  #drawCharts(
    charts: ChartsModule,
    page: { locale: string; rtl: boolean; times: string[]; days: string[] },
    labels: Record<string, string>
  ): void {
    this.#destroyCharts();
    const settings = {
      colors: this.#colors(),
      animate: !this.#media.matchMedia('(prefers-reduced-motion: reduce)').matches,
      locale: page.locale,
      rtl: page.rtl,
    };

    this.#charts = [
      new charts.Chart(
        this.trafficCanvas().nativeElement,
        charts.trafficChart(
          page.times,
          [
            { label: labels['dashboard.views'] ?? '', data: TRAFFIC.views },
            { label: labels['dashboard.downloads'] ?? '', data: TRAFFIC.downloads },
          ],
          settings
        )
      ),
      new charts.Chart(
        this.revenueCanvas().nativeElement,
        charts.revenueChart(
          page.days,
          { label: labels['dashboard.weekly_revenue'] ?? '', data: WEEKLY_REVENUE },
          settings
        )
      ),
    ];
  }

  /** Resolves the system color tokens of the current theme to `rgb()` values. */
  #colors(): ChartColors {
    const probe = this.probe().nativeElement;
    const view = this.#document.defaultView;
    const resolve = (token: string) => {
      probe.style.color = `var(${token})`;
      return view?.getComputedStyle(probe).color ?? '';
    };
    return {
      primary: resolve('--mat-sys-primary'),
      secondary: resolve('--mat-sys-tertiary'),
      text: resolve('--mat-sys-on-surface-variant'),
      grid: resolve('--mat-sys-outline-variant'),
      font: view?.getComputedStyle(probe).fontFamily ?? '',
    };
  }

  #destroyCharts(): void {
    this.#charts.forEach(chart => chart.destroy());
    this.#charts = [];
  }
}
