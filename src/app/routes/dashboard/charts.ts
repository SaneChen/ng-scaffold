/**
 * The dashboard's Chart.js setup, loaded on demand with `import('./charts')`.
 *
 * How this file was built: written by hand (a plain module; Angular CLI has no generator for it).
 *   1. Registers only the Chart.js parts the two charts use (line with fill, radar, their scales,
 *      tooltip and legend), so the lazy chunk stays small.
 *   2. `trafficChart()` and `revenueChart()` build the configurations of ng-matero's area and
 *      radar charts from the data, the translated labels and the `ChartOptions` of the page
 *      (theme colors, animation, number locale, text direction; the time axis runs right to left
 *      in RTL). The second traffic series is dashed, so the two differ by more than color.
 *
 * Why: ng-matero imported ApexCharts statically, which put the whole library in the dashboard's
 * chunk. ApexCharts 5+ is also no longer MIT licensed (free only below US$2M revenue, and not for
 * redistribution in toolkits), which a scaffold installed with `ng add` cannot impose on its
 * users; Chart.js is MIT licensed.
 */
import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip
);

export { Chart };

/** Colors resolved from the Material system tokens of the current theme. */
export interface ChartColors {
  primary: string;
  secondary: string;
  text: string;
  grid: string;
  font: string;
}

/** Page settings that every chart follows. */
export interface ChartSettings {
  colors: ChartColors;
  animate: boolean;
  /** BCP 47 language for the numbers on axes and tooltips. */
  locale: string;
  rtl: boolean;
}

export interface Series {
  label: string;
  data: number[];
}

export function trafficChart(
  labels: string[],
  series: readonly [Series, Series],
  settings: ChartSettings
): ChartConfiguration<'line'> {
  const { colors } = settings;
  return {
    type: 'line',
    data: {
      labels,
      datasets: series.map((item, i) => {
        const color = i === 0 ? colors.primary : colors.secondary;
        return {
          ...item,
          borderColor: color,
          backgroundColor: translucent(color),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderDash: i === 0 ? [] : [6, 4],
        };
      }),
    },
    options: {
      ...common(settings),
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          reverse: settings.rtl,
          grid: { color: colors.grid },
          ticks: { color: colors.text },
        },
        y: { grid: { color: colors.grid }, ticks: { color: colors.text }, beginAtZero: true },
      },
    },
  };
}

export function revenueChart(
  labels: string[],
  series: Series,
  settings: ChartSettings
): ChartConfiguration<'radar'> {
  const { colors } = settings;
  return {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          ...series,
          borderColor: colors.secondary,
          backgroundColor: translucent(colors.secondary),
          pointBackgroundColor: colors.secondary,
          pointRadius: 4,
        },
      ],
    },
    options: {
      ...common(settings),
      scales: {
        r: {
          beginAtZero: true,
          grid: { color: colors.grid },
          angleLines: { color: colors.grid },
          pointLabels: { color: colors.text },
          ticks: { color: colors.text, backdropColor: 'transparent' },
        },
      },
    },
  };
}

function common({ colors, animate, locale, rtl }: ChartSettings) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    locale,
    animation: animate ? undefined : (false as const),
    color: colors.text,
    font: { family: colors.font },
    plugins: {
      legend: { position: 'top' as const, align: 'end' as const, rtl },
      tooltip: { rtl },
    },
  };
}

/** An `rgb()` color (as resolved by `getComputedStyle`) at 20% opacity, for the filled areas. */
export function translucent(color: string): string {
  const [r, g, b] = color.match(/[\d.]+/g) ?? [];
  return b === undefined ? color : `rgba(${r}, ${g}, ${b}, 0.2)`;
}
