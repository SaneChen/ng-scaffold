/**
 * Icons demo (`/design/icons`): every icon of the bundled Material Symbols font, searchable.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/design/icons` generated the component, template, styles and
 *      spec; the class was renamed `DesignIcons`.
 *   2. The names come from public/data/demo/icon-names.json (generated from the font by
 *      tools/icon-names.py) through `httpResource`; a search field filters them (`computed`)
 *      and a `MatPaginator` shows them a page at a time.
 *   3. Each icon is a button that copies its name (CDK `Clipboard`) and confirms with a toast.
 *
 * Why: ng-matero showed a hand-made list of about 1,000 names grouped in categories that no longer
 * match the font, and rendered all of them at once.
 */
import { Clipboard } from '@angular/cdk/clipboard';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Toaster } from '@core';
import { PageHeader } from '@shared';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/** Icons per page. */
export const ICONS_PAGE_SIZE = 120;

@Component({
  imports: [
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-design-icons',
  styleUrl: './icons.scss',
  templateUrl: './icons.html',
})
export class DesignIcons {
  readonly #clipboard = inject(Clipboard);
  readonly #toaster = inject(Toaster);
  readonly #translate = inject(TranslateService);

  readonly #names = httpResource<string[]>(() => 'data/demo/icon-names.json', {
    defaultValue: [],
  });

  protected readonly loading = this.#names.isLoading;
  protected readonly failed = computed(() => this.#names.status() === 'error');
  protected readonly query = signal('');
  protected readonly pageSize = ICONS_PAGE_SIZE;

  protected readonly matches = computed(() => {
    const words = this.query()
      .trim()
      .toLowerCase()
      .split(/[\s_]+/)
      .filter(Boolean);
    return this.#names.hasValue()
      ? this.#names.value().filter(name => words.every(word => name.includes(word)))
      : [];
  });

  /** Back to the first page whenever the matches change. */
  protected readonly pageIndex = linkedSignal({ source: this.matches, computation: () => 0 });

  protected readonly page = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.matches().slice(start, start + this.pageSize);
  });

  protected search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected changePage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  protected retry(): void {
    this.#names.reload();
  }

  protected copy(name: string): void {
    if (this.#clipboard.copy(name)) {
      this.#toaster.success(this.#translate.instant('demo.design.icons.copied', { name }));
    }
  }
}
