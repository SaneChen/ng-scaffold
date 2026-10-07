/**
 * Unit tests for `Dashboard`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/dashboard` generated the "should create" test.
 *   2. Replaced it with tests of the statistics, table and message list, and of the charts through
 *      a fake `CHARTS_LOADER` whose `Chart` records its configuration (jsdom has no canvas): both
 *      charts are drawn with translated, localized labels, redrawn after a theme or language
 *      change, follow the text direction, come with tables of their values, and are destroyed
 *      with the page (also when it is gone before Chart.js has loaded).
 */
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import type { ChartConfiguration } from 'chart.js';
import { revenueChart, trafficChart, translucent } from './charts';
import { CHARTS_LOADER, ChartsModule, Dashboard } from './dashboard';

class FakeChart {
  static readonly instances: FakeChart[] = [];
  destroyed = false;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly config: ChartConfiguration
  ) {
    FakeChart.instances.push(this);
  }

  destroy(): void {
    this.destroyed = true;
  }
}

describe('Dashboard', () => {
  let host: HTMLElement;
  let loaded: Promise<ChartsModule>;

  async function render(): Promise<ComponentFixture<Dashboard>> {
    const fixture = TestBed.createComponent(Dashboard);
    host = fixture.nativeElement;
    await fixture.whenStable();
    await loaded;
    await fixture.whenStable();
    return fixture;
  }

  function live(): FakeChart[] {
    return FakeChart.instances.filter(chart => !chart.destroyed);
  }

  beforeEach(() => {
    FakeChart.instances.length = 0;
    loaded = Promise.resolve({
      Chart: FakeChart,
      trafficChart,
      revenueChart,
      translucent,
    } as unknown as ChartsModule);
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: CHARTS_LOADER, useValue: () => loaded }],
    });
  });

  afterEach(() => localStorage.clear());

  it('should show the statistics, the table and the messages', async () => {
    await render();

    const amounts = Array.from(host.querySelectorAll('.amount')).map(el => el.textContent);
    expect(amounts).toEqual(['180,200', '70,205', '1,291,922', '1,922']);
    expect(host.querySelector('mat-progress-bar')?.getAttribute('aria-label')).toBe(
      'dashboard.monthly_target'
    );
    const table = host.querySelector('table[mat-table]');
    expect(
      Array.from(table?.querySelectorAll('th') ?? []).map(th => th.textContent?.trim())
    ).toEqual(['position', 'name', 'weight', 'symbol']);
    expect(table?.querySelector('td:nth-child(3)')?.textContent).toBe('1.0079');
    expect(
      host.querySelectorAll('mat-list[role="list"] mat-list-item[role="listitem"]')
    ).toHaveLength(5);
    expect(host.querySelector('h1')?.textContent).toBe('menu.dashboard');
  });

  it('should draw both charts as described images', async () => {
    await render();

    const [traffic, revenue] = live();
    expect(traffic.canvas.getAttribute('role')).toBe('img');
    expect(traffic.canvas.getAttribute('aria-label')).toBe('dashboard.traffic_chart');
    expect(traffic.config.type).toBe('line');
    expect(traffic.config.data.datasets.map(set => set.label)).toEqual([
      'dashboard.views',
      'dashboard.downloads',
    ]);
    expect(revenue.config.type).toBe('radar');
    expect(revenue.config.data.labels?.[0]).toBe('Sunday');
  });

  it('should redraw the charts after a theme or language change', async () => {
    await render();
    const settings = TestBed.inject(SettingsStore);

    settings.update({ theme: 'dark' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(FakeChart.instances).toHaveLength(4);
    expect(live()).toHaveLength(2);

    settings.update({ language: 'zh-CN' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(live()[1].config.data.labels?.[0]).toBe('星期日');
  });

  it('should follow the language and the text direction in the charts', async () => {
    TestBed.inject(SettingsStore).update({ dir: 'rtl' });
    await render();

    const [traffic] = live();
    const options = traffic.config.options as {
      locale?: string;
      scales?: { x?: { reverse?: boolean } };
      plugins?: { legend?: { rtl?: boolean } };
    };
    expect(options.locale).toBe('en-US');
    expect(options.scales?.x?.reverse).toBe(true);
    expect(options.plugins?.legend?.rtl).toBe(true);
  });

  it('should offer the chart values as tables', async () => {
    await render();

    const [traffic, revenue] = Array.from(host.querySelectorAll('table.cdk-visually-hidden'));
    expect(traffic.querySelectorAll('tr')).toHaveLength(8);
    const sunday = revenue.querySelectorAll('tr')[1];
    expect(Array.from(sunday.children).map(cell => cell.textContent?.trim())).toEqual([
      'Sunday',
      '30',
    ]);
  });

  it('should destroy the charts with the page', async () => {
    const fixture = await render();

    fixture.destroy();

    expect(live()).toHaveLength(0);
  });

  it('should not draw charts when the page is gone before they load', async () => {
    const module = await loaded;
    let resolve: (value: ChartsModule) => void = () => undefined;
    loaded = new Promise(done => (resolve = done));
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    fixture.destroy();
    resolve(module);
    await loaded;
    await TestBed.inject(ApplicationRef).whenStable();

    expect(FakeChart.instances).toHaveLength(0);
  });
});
