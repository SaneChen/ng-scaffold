/**
 * Unit tests for `demoReposInterceptor` and its `search()`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor routes/tables/remote-data/demo-repos` generated the "should be
 *      created" test.
 *   2. Replaced it with tests of `search()` (query, sorts, orders, pages, unknown sorts) and of the
 *      interceptor through `HttpClient` (latency 0): the search is answered from the sample file,
 *      other requests pass through.
 */
import { HttpClient, HttpParams, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  DEMO_REPOS_LATENCY,
  DEMO_REPOS_URL,
  demoReposInterceptor,
  Repo,
  search,
} from './demo-repos-interceptor';

function repo(id: number, name: string, stars: number, updated: string): Repo {
  return {
    id,
    name,
    owner: { login: 'tidepool', avatar_url: '' },
    description: `The ${name} project.`,
    stargazers_count: stars,
    forks_count: 100 - stars,
    open_issues: 0,
    language: 'TypeScript',
    license: null,
    homepage: null,
    fork: false,
    archived: false,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: updated,
  };
}

const REPOS = [
  repo(1, 'charts', 30, '2024-05-01T00:00:00Z'),
  repo(2, 'forms', 10, '2025-01-01T00:00:00Z'),
  repo(3, 'grid', 20, '2023-01-01T00:00:00Z'),
];

function names(params: Record<string, string>): string[] {
  return search(REPOS, new HttpParams({ fromObject: params })).items.map(item => item.name);
}

describe('search', () => {
  it('should keep the file order without a sort', () => {
    expect(names({})).toEqual(['charts', 'forms', 'grid']);
    expect(names({ sort: 'constructor' })).toEqual(['charts', 'forms', 'grid']);
  });

  it('should sort by stars, forks or update, descending unless asked otherwise', () => {
    expect(names({ sort: 'stars' })).toEqual(['charts', 'grid', 'forms']);
    expect(names({ sort: 'stars', order: 'asc' })).toEqual(['forms', 'grid', 'charts']);
    expect(names({ sort: 'forks' })).toEqual(['forms', 'grid', 'charts']);
    expect(names({ sort: 'updated' })).toEqual(['forms', 'charts', 'grid']);
  });

  it('should filter by name, description or owner, ignoring case', () => {
    expect(names({ q: ' GRID ' })).toEqual(['grid']);
    expect(names({ q: 'the forms' })).toEqual(['forms']);
    expect(names({ q: 'tidepool' })).toHaveLength(3);
    expect(names({ q: 'nothing' })).toEqual([]);
  });

  it('should return the asked page and the total count', () => {
    const page = search(REPOS, new HttpParams({ fromObject: { page: '2', per_page: '2' } }));

    expect(page.total_count).toBe(3);
    expect(page.items.map(item => item.name)).toEqual(['grid']);
  });
});

describe('demoReposInterceptor', () => {
  let http: HttpClient;
  let network: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DEMO_REPOS_LATENCY, useValue: 0 },
        provideHttpClient(withInterceptors([demoReposInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    network = TestBed.inject(HttpTestingController);
  });

  afterEach(() => network.verify());

  it('should answer the search from the sample file', async () => {
    const answer = firstValueFrom(
      http.get(DEMO_REPOS_URL, { params: { q: 's', sort: 'stars', per_page: 1 } })
    );

    const file = network.expectOne('data/demo/repos.json');
    expect(file.request.params.keys()).toEqual([]);
    file.flush(REPOS);

    expect(await answer).toEqual({ total_count: 2, items: [REPOS[0]] });
  });

  it('should let other requests through', async () => {
    const answer = firstValueFrom(http.get('data/other.json'));

    network.expectOne('data/other.json').flush({ ok: true });

    expect(await answer).toEqual({ ok: true });
  });
});
