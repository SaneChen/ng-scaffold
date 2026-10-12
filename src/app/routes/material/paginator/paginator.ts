/**
 * MaterialPaginator demo with local data and translated accessible state.
 * How this file was built: `yarn ng g component routes/material/paginator`, then replaced
 * the generated placeholder with signal-derived state and native table semantics.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { computed, linkedSignal, signal } from '@angular/core';
import { form, FormField, min, max, validate } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
  ],
  selector: 'app-material-paginator',
  styleUrl: './paginator.scss',
  templateUrl: './paginator.html',
})
export class MaterialPaginator {
  protected readonly key = 'demo.material.paginator';
  protected readonly values = signal({ length: 100, pageSize: 10, options: '5,10,25,100' });
  protected readonly form = form(this.values, path => {
    min(path.length, 0);
    max(path.length, 1000000);
    min(path.pageSize, 1);
    max(path.pageSize, 1000);
    validate(path.length, field =>
      Number.isInteger(field.value()) ? undefined : { kind: 'integer' }
    );
    validate(path.pageSize, field =>
      Number.isInteger(field.value()) ? undefined : { kind: 'integer' }
    );
  });
  protected readonly length = linkedSignal({
    source: () => ({ value: this.values().length, valid: this.form.length().valid() }),
    computation: (state, previous) => (state.valid ? state.value : (previous?.value ?? 100)),
  });
  protected readonly pageSize = linkedSignal({
    source: () => ({ value: this.values().pageSize, valid: this.form.pageSize().valid() }),
    computation: (state, previous) => (state.valid ? state.value : (previous?.value ?? 10)),
  });
  protected readonly options = computed(() =>
    [
      ...new Set(
        this.values()
          .options.split(',')
          .map(Number)
          .filter(value => Number.isInteger(value) && value > 0 && value <= 1000)
      ),
    ].sort((first, second) => first - second)
  );
  protected readonly pageIndex = linkedSignal({
    source: () => ({ length: this.length(), size: this.pageSize() }),
    computation: () => 0,
  });
  protected readonly lastEvent = signal<PageEvent | undefined>(undefined);
  protected changePage(event: PageEvent): void {
    this.values.update(values => ({ ...values, pageSize: event.pageSize }));
    this.pageIndex.set(event.pageIndex);
    this.lastEvent.set(event);
  }
}
