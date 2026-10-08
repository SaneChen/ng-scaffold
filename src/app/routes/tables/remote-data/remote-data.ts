/**
 * Remote-data grid demo (`/tables/remote-data`): an `mtx-grid` paged, sorted and searched on the
 * server.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/tables/remote-data` generated the component, template, styles
 *      and spec; the class was renamed `TablesRemoteData`.
 *   2. A Signal Form edits the query (text, sort, order); Search copies it into the query of the
 *      request and goes back to the first page, Reset restores both.
 *   3. `httpResource()` requests `DEMO_REPOS_URL` with the query and the grid's page; the
 *      simulated server (demo-repos-interceptor.ts, registered on the route) answers. A
 *      `linkedSignal` keeps the last answer on screen while the next page loads.
 *   4. The columns are `computed()` from the `demo.tables` translations and the language: yes/no
 *      and dates are formatted on the page (Angular's `DatePipe` only knows en-US here).
 *
 * Why: ng-matero searched api.github.com (network, foreign host, rate limits) with
 * `ngModel`, a hand-written service and `detectChanges()` calls.
 */
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { LanguageStore } from '@core';
import { MtxGrid, MtxGridColumn } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { format, parseISO } from 'date-fns';
import { dateLocale } from '../../demo/demo-dates';
import { textAt } from '../../demo/demo-translations';
import { DEMO_REPOS_URL, Repo, RepoSearch, RepoSort } from './demo-repos-interceptor';

export interface RepoQuery {
  q: string;
  sort: RepoSort | '';
  order: 'desc' | 'asc';
}

const DEFAULT_QUERY: RepoQuery = { q: '', sort: 'stars', order: 'desc' };
const DEFAULT_PAGE = { index: 0, size: 10 };
const NO_RESULT: RepoSearch = { total_count: 0, items: [] };

@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MtxGrid,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-tables-remote-data',
  styleUrl: './remote-data.scss',
  templateUrl: './remote-data.html',
})
export class TablesRemoteData {
  readonly #language = inject(LanguageStore);
  readonly #translations = toSignal(inject(TranslateService).stream('demo.tables'));

  protected readonly sorts: RepoSort[] = ['stars', 'forks', 'updated'];
  protected readonly orders: RepoQuery['order'][] = ['desc', 'asc'];

  protected readonly queryForm = form(signal<RepoQuery>({ ...DEFAULT_QUERY }), {
    submission: {
      action: async field => {
        this.#query.set({ ...field().value() });
        this.page.set({ ...this.page(), index: 0 });
        return undefined;
      },
    },
  });

  /** The query of the last search. */
  readonly #query = signal<RepoQuery>({ ...DEFAULT_QUERY });
  protected readonly page = signal(DEFAULT_PAGE);

  protected readonly repos = httpResource<RepoSearch>(() => {
    const { q, sort, order } = this.#query();
    const { index, size } = this.page();
    return {
      url: DEMO_REPOS_URL,
      params: { q, sort, order, page: index + 1, per_page: size },
    };
  });

  /** The last answer, kept while the next one loads. */
  protected readonly result = linkedSignal<RepoSearch | undefined, RepoSearch>({
    source: () => (this.repos.hasValue() ? this.repos.value() : undefined),
    computation: (value, previous) => value ?? previous?.value ?? NO_RESULT,
  });

  protected readonly columns = computed<MtxGridColumn<Repo>[]>(() => {
    const header = (key: string) => this.#text(`columns.${key}`);
    const yesNo = (value: boolean) => this.#text(`remote_data.${value ? 'yes' : 'no'}`);
    const locale = dateLocale(this.#language.current());
    const date = (iso: string) => format(parseISO(iso), 'PP', { locale });
    return [
      { header: header('repo'), field: 'name', minWidth: 140 },
      { header: header('owner'), field: 'owner.login', minWidth: 140 },
      { header: header('avatar'), field: 'owner.avatar_url', type: 'image', width: '80px' },
      { header: header('description'), field: 'description', minWidth: 300 },
      { header: header('stars'), field: 'stargazers_count', type: 'number' },
      { header: header('forks'), field: 'forks_count', type: 'number' },
      { header: header('issues'), field: 'open_issues', type: 'number' },
      { header: header('language'), field: 'language' },
      { header: header('license'), field: 'license.name', minWidth: 160 },
      { header: header('homepage'), field: 'homepage', type: 'link', minWidth: 220 },
      { header: header('forked'), field: 'fork', formatter: row => yesNo(row.fork) },
      { header: header('archived'), field: 'archived', formatter: row => yesNo(row.archived) },
      {
        header: header('created'),
        field: 'created_at',
        minWidth: 120,
        formatter: row => date(row.created_at),
      },
      {
        header: header('updated'),
        field: 'updated_at',
        minWidth: 120,
        formatter: row => date(row.updated_at),
      },
    ];
  });

  protected changePage({ pageIndex, pageSize }: PageEvent): void {
    this.page.set({ index: pageIndex, size: pageSize });
  }

  protected reset(): void {
    this.queryForm().reset({ ...DEFAULT_QUERY });
    this.#query.set({ ...DEFAULT_QUERY });
    this.page.set(DEFAULT_PAGE);
  }

  #text(path: string): string {
    return textAt(this.#translations(), path);
  }
}
