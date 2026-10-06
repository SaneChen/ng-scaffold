/**
 * Translated labels for every `<mat-paginator>` (page size, navigation buttons, range).
 *
 * How this file was built:
 *   1. `yarn ng g class core/i18n/paginator-intl` generated an empty `PaginatorIntl` class and its
 *      spec.
 *   2. Made it extend `MatPaginatorIntl` and decorated it with `@Service({ autoProvided: false })`:
 *      it is only meant to replace Material's default, through
 *      `{ provide: MatPaginatorIntl, useClass: PaginatorIntl }` in the `providers` of
 *      `AdminLayout` (src/app/theme), the parent of every page with a paginator.
 *   3. Added an `effect()` that copies the `paginator.*` translations onto the label fields and
 *      emits `changes`, and overrode `getRangeLabel` with a translated version.
 *   4. Moved that provider out of app.config.ts and this file out of the `@core` barrel (import it
 *      from `@core/i18n/paginator-intl`): anything the main bundle reaches statically, here all of
 *      `@angular/material/paginator`, also hoists into it the modules it shares with lazy chunks
 *      (buttons, select, overlay, about 180 kB).
 *
 * Why: `TranslateService.instant()` reads ngx-translate's language and translation signals, so the
 * effect re-runs after every language switch (or translation update) and `changes.next()` tells
 * each paginator to re-render — no manual subscription to `onLangChange` to clean up. ng-matero
 * built a separate `MatPaginatorIntl` instance inside a service and subscribed without teardown.
 */
import { effect, inject, Service } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

@Service({ autoProvided: false })
export class PaginatorIntl extends MatPaginatorIntl {
  readonly #translate = inject(TranslateService);

  constructor() {
    super();
    effect(() => {
      this.itemsPerPageLabel = this.#text('paginator.items_per_page_label');
      this.nextPageLabel = this.#text('paginator.next_page_label');
      this.previousPageLabel = this.#text('paginator.previous_page_label');
      this.firstPageLabel = this.#text('paginator.first_page_label');
      this.lastPageLabel = this.#text('paginator.last_page_label');
      this.changes.next();
    });
  }

  /** "1 – 10 of 100", or the "no records" text for an empty list. */
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.#text('paginator.range_page_label_1', { length });
    }
    const startIndex = page * pageSize;
    // Past the end of the list (e.g. after rows were removed), show the requested range as is.
    const endIndex =
      startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return this.#text('paginator.range_page_label_2', {
      startIndex: startIndex + 1,
      endIndex,
      length,
    });
  };

  #text(key: string, params?: Record<string, number>): string {
    return String(this.#translate.instant(key, params));
  }
}
