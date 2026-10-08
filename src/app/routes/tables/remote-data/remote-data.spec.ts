/**
 * Unit tests for `TablesRemoteData` with its simulated server.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/tables/remote-data` generated the "should create" test.
 *   2. Replaced it with tests through the grid and the query form, with `demoReposInterceptor`
 *      (latency 0) in front of `HttpTestingController`, which serves the sample file: the first
 *      page by stars, the rows kept while the next page loads, a search from the first page, the
 *      reset, the error message, and yes/no and dates in the language.
 */
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SettingsStore } from '@core';
import { MtxGrid } from '@ng-matero/extensions/grid';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DEMO_REPOS_LATENCY, demoReposInterceptor, Repo } from './demo-repos-interceptor';
import { TablesRemoteData } from './remote-data';

const REPOS: Repo[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `repo-${i + 1}`,
  owner: { login: 'tidepool', avatar_url: '' },
  description: i === 4 ? 'The special one.' : 'A sample.',
  stargazers_count: i * 10,
  forks_count: 0,
  open_issues: 0,
  language: 'TypeScript',
  license: null,
  homepage: null,
  fork: i === 0,
  archived: false,
  created_at: '2020-01-02T12:00:00Z',
  updated_at: '2021-03-04T00:00:00Z',
}));

describe('TablesRemoteData', () => {
  let fixture: ComponentFixture<TablesRemoteData>;
  let host: HTMLElement;
  let network: HttpTestingController;

  function grid(): MtxGrid {
    return fixture.debugElement.query(By.directive(MtxGrid)).componentInstance;
  }

  function names(): string[] {
    return (grid().data as Repo[]).map(repo => repo.name);
  }

  function button(text: string): HTMLButtonElement {
    const found = Array.from(host.querySelectorAll<HTMLButtonElement>('.query button')).find(
      candidate => candidate.textContent?.trim() === text
    );
    if (!found) throw new Error(`No button ${text}`);
    return found;
  }

  /** Lets the resource request the sample file, serves it and waits for the answer. */
  async function serve(): Promise<void> {
    TestBed.tick();
    network.expectOne('data/demo/repos.json').flush(REPOS);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(withInterceptors([demoReposInterceptor])),
        provideHttpClientTesting(),
        { provide: DEMO_REPOS_LATENCY, useValue: 0 },
      ],
    });
    const tables = {
      remote_data: { search: 'Search', reset: 'Reset', yes: 'Yes', no: 'No', error: 'Failed' },
    };
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', { demo: { tables } });
    translate.setTranslation('zh-CN', { demo: { tables } });
    network = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TablesRemoteData);
    host = fixture.nativeElement;
    await serve();
  });

  afterEach(() => {
    network.verify();
    localStorage.clear();
  });

  it('should show the first page, most stars first', () => {
    expect(names()).toEqual(Array.from({ length: 10 }, (_, i) => `repo-${12 - i}`));
    expect(grid().length).toBe(12);
    expect(grid().pageIndex).toBe(0);
  });

  it('should keep the rows while the next page loads', async () => {
    grid().page.emit({ pageIndex: 1, pageSize: 10, length: 12 });
    TestBed.tick();

    expect(grid().loading).toBe(true);
    expect(names()).toHaveLength(10);

    network.expectOne('data/demo/repos.json').flush(REPOS);
    await fixture.whenStable();
    expect(grid().loading).toBe(false);
    expect(names()).toEqual(['repo-2', 'repo-1']);
  });

  it('should search from the first page and reset', async () => {
    grid().page.emit({ pageIndex: 1, pageSize: 10, length: 12 });
    await serve();
    const input = host.querySelector<HTMLInputElement>('.query input');
    if (!input) throw new Error('No query input');
    input.value = 'special';
    input.dispatchEvent(new Event('input'));

    button('Search').click();
    await serve();
    expect(names()).toEqual(['repo-5']);
    expect(grid().pageIndex).toBe(0);

    button('Reset').click();
    await serve();
    expect(input.value).toBe('');
    expect(names()).toHaveLength(10);
  });

  it('should say when the repositories cannot be loaded', async () => {
    button('Search').click();
    TestBed.tick();
    network
      .expectOne('data/demo/repos.json')
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(host.querySelector('[role="alert"]')?.textContent?.trim()).toBe('Failed');
  });

  it('should format yes/no and dates in the language', async () => {
    const column = (field: string) => grid().columns.find(col => col.field === field);
    expect(column('fork')?.formatter?.(REPOS[0])).toBe('Yes');
    expect(column('fork')?.formatter?.(REPOS[1])).toBe('No');
    expect(column('created_at')?.formatter?.(REPOS[0])).toBe('Jan 2, 2020');

    TestBed.inject(SettingsStore).update({ language: 'zh-CN' });
    await fixture.whenStable();

    expect(column('created_at')?.formatter?.(REPOS[0])).toBe(
      format(new Date(2020, 0, 2), 'PP', { locale: zhCN })
    );
  });
});
