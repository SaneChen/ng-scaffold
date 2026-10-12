/**
 * MaterialSort demo with local data and translated accessible state.
 * How this file was built: `yarn ng g component routes/material/sort`, then replaced
 * the generated placeholder with signal-derived state and native table semantics.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSortModule, Sort } from '@angular/material/sort';
import { TranslateService } from '@ngx-translate/core';
import { textAt } from '../../demo/demo-translations';

@Component({
  imports: [MatCardModule, TranslatePipe, PageHeader, MatSortModule],
  selector: 'app-material-sort',
  styleUrl: './sort.scss',
  templateUrl: './sort.html',
})
export class MaterialSort {
  protected readonly key = 'demo.material.sort';
  readonly #translate = inject(TranslateService);
  readonly #labels = toSignal(this.#translate.stream('demo.material.sort.desserts'));
  protected readonly columns = ['name', 'calories', 'fat', 'carbs', 'protein'] as const;
  protected readonly desserts = [
    { name: 'yogurt', calories: 159, fat: 6, carbs: 24, protein: 4 },
    { name: 'sandwich', calories: 237, fat: 9, carbs: 37, protein: 4 },
    { name: 'eclair', calories: 262, fat: 16, carbs: 24, protein: 6 },
    { name: 'cupcake', calories: 305, fat: 4, carbs: 67, protein: 4 },
    { name: 'gingerbread', calories: 356, fat: 16, carbs: 49, protein: 4 },
  ];
  protected readonly sort = signal<Sort>({ active: '', direction: '' });
  protected readonly rows = computed(() => {
    const sort = this.sort();
    const labels = this.#labels();
    const column = this.columns.find(column => column === sort.active);
    if (!column || !sort.direction) return this.desserts;
    const collator = new Intl.Collator(this.#translate.getCurrentLang() || 'en-US');
    return [...this.desserts].sort((first, second) => {
      const result =
        column === 'name'
          ? collator.compare(textAt(labels, first.name), textAt(labels, second.name))
          : first[column] - second[column];
      return sort.direction === 'asc' ? result : -result;
    });
  });
}
