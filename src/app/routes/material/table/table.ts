/**
 * MaterialTable demo with local data and translated accessible state.
 * How this file was built: `yarn ng g component routes/material/table`, then replaced
 * the generated placeholder with signal-derived state and native table semantics.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { computed, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
  ],
  selector: 'app-material-table',
  styleUrl: './table.scss',
  templateUrl: './table.html',
})
export class MaterialTable {
  protected readonly key = 'demo.material.table';
  protected readonly columns = ['name', 'color', 'age'];
  protected readonly examples = ['basic', 'sorted', 'paged'];
  protected readonly users = [
    { name: 'Austin', color: 'blue', age: 30 },
    { name: 'Jeremy', color: 'green', age: 33 },
    { name: 'Kara', color: 'purple', age: 29 },
    { name: 'Tina', color: 'yellow', age: 35 },
    { name: 'Brad', color: 'pink', age: 40 },
    { name: 'Jules', color: 'red', age: 21 },
  ];
  protected readonly sort = signal<Sort>({ active: 'age', direction: 'asc' });
  protected readonly page = signal({ pageIndex: 0, pageSize: 3 });
  protected readonly sorted = computed(() => {
    const sort = this.sort();
    if (!sort.direction) return this.users;
    return [...this.users].sort(
      (first, second) => (first.age - second.age) * (sort.direction === 'asc' ? 1 : -1)
    );
  });
  protected readonly paged = computed(() => {
    const page = this.page();
    const start = page.pageIndex * page.pageSize;
    return this.users.slice(start, start + page.pageSize);
  });
  protected changePage(event: PageEvent): void {
    this.page.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }
}
