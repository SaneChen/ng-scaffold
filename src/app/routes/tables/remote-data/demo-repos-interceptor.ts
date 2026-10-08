/**
 * `demoReposInterceptor`: a simulated server for the remote-data demo. It answers
 * `GET demo-api/repos?q=&sort=&order=&page=&per_page=` like GitHub's repository search, from the
 * sample file `data/demo/repos.json`, after `DEMO_REPOS_LATENCY` ms.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor routes/tables/remote-data/demo-repos` generated a functional
 *      `HttpInterceptorFn` and its spec.
 *   2. Other requests pass through. The search requests the sample file (through the rest of the
 *      chain) and answers with the matching page: `q` filters by name, description and owner,
 *      `sort` is `stars`, `forks` or `updated` (the file's order otherwise), `order` is `desc`
 *      (default) or `asc`, `page` starts at 1 and `per_page` is at most 100.
 *   3. Registered only on the remote-data route, by its own `provideHttpClient()` with
 *      `withRequestsMadeViaParent()`: the app's interceptors and backend are untouched.
 *
 * Why: ng-matero's page called api.github.com, which needs the network, a foreign host and is
 * rate limited; the demo should show server-side paging without depending on any of these.
 */
import { HttpInterceptorFn, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { delay, filter, map } from 'rxjs';

/** The URL of the simulated search. */
export const DEMO_REPOS_URL = 'demo-api/repos';

/** Simulated latency of the search, in milliseconds. */
export const DEMO_REPOS_LATENCY = new InjectionToken<number>('DEMO_REPOS_LATENCY', {
  providedIn: 'root',
  factory: () => 500,
});

const DATA_URL = 'data/demo/repos.json';

export interface Repo {
  id: number;
  name: string;
  owner: { login: string; avatar_url: string };
  description: string;
  stargazers_count: number;
  forks_count: number;
  open_issues: number;
  language: string;
  license: { name: string } | null;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepoSearch {
  total_count: number;
  items: Repo[];
}

export type RepoSort = 'stars' | 'forks' | 'updated';

const SORT_KEYS: Record<RepoSort, (repo: Repo) => number | string> = {
  stars: repo => repo.stargazers_count,
  forks: repo => repo.forks_count,
  updated: repo => repo.updated_at,
};

export const demoReposInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || req.url !== DEMO_REPOS_URL) {
    return next(req);
  }
  const latency = inject(DEMO_REPOS_LATENCY);
  return next(req.clone({ url: DATA_URL, params: new HttpParams() })).pipe(
    filter(event => event instanceof HttpResponse),
    map(response =>
      response.clone({ body: search(response.body as Repo[], req.params), url: req.urlWithParams })
    ),
    delay(latency)
  );
};

/** The page of `repos` that the search parameters ask for. */
export function search(repos: readonly Repo[], params: HttpParams): RepoSearch {
  const query = params.get('q')?.trim().toLowerCase() ?? '';
  const sort = params.get('sort') ?? '';
  const sortKey = Object.hasOwn(SORT_KEYS, sort) ? SORT_KEYS[sort as RepoSort] : undefined;
  const direction = params.get('order') === 'asc' ? 1 : -1;
  const page = Math.max(1, Number(params.get('page')) || 1);
  const perPage = Math.min(100, Math.max(1, Number(params.get('per_page')) || 30));

  const found = repos.filter(repo =>
    [repo.name, repo.description, repo.owner.login].some(text => text.toLowerCase().includes(query))
  );
  if (sortKey) {
    found.sort((a, b) => {
      const [x, y] = [sortKey(a), sortKey(b)];
      return (x < y ? -1 : x > y ? 1 : 0) * direction;
    });
  }
  return { total_count: found.length, items: found.slice((page - 1) * perPage, page * perPage) };
}
