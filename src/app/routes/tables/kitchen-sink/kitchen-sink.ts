/**
 * Kitchen-sink grid demo (`/tables/kitchen-sink`): the `mtx-grid` of @ng-matero/extensions with
 * its options switched on and off.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/tables/kitchen-sink` generated the component, template,
 *      styles and spec; the class was renamed `TablesKitchenSink`.
 *   2. One Signal Form holds the grid's options (checkboxes and a radio group bound with
 *      `[formField]`); the grid reads them from the form's value signal.
 *   3. The columns are `computed()` from the `demo.tables` translations (headers, genders, button
 *      texts) and the "expandable" option, so they follow the language. The row buttons have
 *      text: the grid gives its icon buttons a tooltip but no accessible name.
 *   4. The rows live in a signal: Edit opens `TablesElementEdit` (under this page's injector, for
 *      the route's translations) and stores what it returns; Delete asks in the grid's
 *      confirmation, removes the row, says so in a toast and moves the focus to the grid; the two
 *      update buttons replace the list. Rows are tracked by position, so an edited row keeps its
 *      DOM and the focus returns to its Edit button.
 *   5. Public header/cell/toolbar templates provide named selection, expansion, sorting and
 *      pinning controls; selection is synchronized with the grid and all-data selection is explicit.
 *      Expansion ARIA state resets alongside the grid's input-driven row model.
 *   6. Sorting uses the public MatSort and dataSource APIs. Switching resizable tables creates
 *      a new MatSort after ngOnChanges; afterRenderEffect reconnects it after the view updates.
 *
 * Why: ng-matero bound plain fields with `ngModel` (stale under OnPush), mutated the columns,
 * logged events to the console, "deleted" nothing and left the texts in English.
 */
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  linkedSignal,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { Sort } from '@angular/material/sort';
import { Toaster } from '@core';
import { MtxGrid, MtxGridColumn, MtxGridColumnPinOption } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { textAt } from '../../demo/demo-translations';
import { TablesElementEdit } from './element-edit';
import { ELEMENTS, PeriodicElement } from './elements';

export interface GridOptions {
  rowSelectable: boolean;
  hideRowSelectionCheckbox: boolean;
  multiSelectable: boolean;
  showToolbar: boolean;
  columnHideable: boolean;
  columnSortable: boolean;
  columnPinnable: boolean;
  rowHover: boolean;
  rowStriped: boolean;
  expandable: boolean;
  showPaginator: boolean;
  loading: boolean;
  columnResizable: boolean;
}

/** The options shown as checkboxes, in ng-matero's order (`multiSelectable` is a radio group). */
const CHECKBOXES = [
  'rowSelectable',
  'hideRowSelectionCheckbox',
  'showToolbar',
  'columnHideable',
  'columnSortable',
  'columnPinnable',
  'rowHover',
  'rowStriped',
  'expandable',
  'showPaginator',
  'loading',
  'columnResizable',
] as const satisfies readonly (keyof GridOptions)[];

@Component({
  imports: [
    FormField,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MtxGrid,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-tables-kitchen-sink',
  styleUrl: './kitchen-sink.scss',
  templateUrl: './kitchen-sink.html',
})
export class TablesKitchenSink {
  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);
  readonly #toaster = inject(Toaster);
  readonly #translate = inject(TranslateService);

  readonly #translations = toSignal(this.#translate.stream('demo.tables'));

  constructor() {
    afterRenderEffect(() => {
      const grid = this.gridComponent();
      if (this.options().columnResizable === grid.columnResizable) {
        grid.dataSource.sort = grid.sort;
      }
    });
  }

  private readonly grid = viewChild.required('grid', { read: ElementRef<HTMLElement> });
  private readonly gridComponent = viewChild.required(MtxGrid);
  protected readonly sortState = signal<Sort>({ active: '', direction: '' });

  protected readonly checkboxes = CHECKBOXES;

  /** Rows keep their DOM (and the focus of their buttons) when an edit replaces their data. */
  protected readonly trackByPosition = (_: number, row: PeriodicElement) => row.position;

  protected readonly options = signal<GridOptions>({
    rowSelectable: true,
    hideRowSelectionCheckbox: false,
    multiSelectable: true,
    showToolbar: true,
    columnHideable: true,
    columnSortable: true,
    columnPinnable: true,
    rowHover: false,
    rowStriped: false,
    expandable: false,
    showPaginator: true,
    loading: false,
    columnResizable: false,
  });
  protected readonly optionsForm = form(this.options);

  protected readonly elements = signal<PeriodicElement[]>([...ELEMENTS]);
  readonly #multiSelectable = computed(() => this.options().multiSelectable);
  protected readonly selected = linkedSignal<
    { rows: PeriodicElement[]; multiple: boolean },
    PeriodicElement[]
  >({
    source: () => ({ rows: this.elements(), multiple: this.#multiSelectable() }),
    computation: (state, previous) => {
      const positions = new Set(previous?.value.map(row => row.position) ?? []);
      const selected = state.rows.filter(row => positions.has(row.position));
      return state.multiple ? selected : selected.slice(0, 1);
    },
  });
  readonly #expandable = computed(() => this.options().expandable);
  readonly #columnPreferences = signal<
    Pick<MtxGridColumn<PeriodicElement>, 'field' | 'hide' | 'pinned'>[]
  >([]);

  protected readonly pinOptions = computed<MtxGridColumnPinOption[]>(() => [
    { value: 'left', label: this.#text('kitchen_sink.pin.left') },
    { value: 'right', label: this.#text('kitchen_sink.pin.right') },
    { value: null, label: this.#text('kitchen_sink.pin.none') },
  ]);

  protected readonly columns = computed<MtxGridColumn<PeriodicElement>[]>(() => {
    const header = (field: string) => this.#text(`columns.${field}`);
    const action = (key: string) => this.#text(`kitchen_sink.${key}`);
    const genders = { male: this.#text('genders.male'), female: this.#text('genders.female') };
    const text = (
      field: keyof PeriodicElement,
      width: number,
      extra: Partial<MtxGridColumn<PeriodicElement>> = {}
    ): MtxGridColumn<PeriodicElement> => ({
      header: header(field),
      field,
      minWidth: width,
      ...extra,
    });
    const columns: MtxGridColumn<PeriodicElement>[] = [
      {
        header: this.#text('kitchen_sink.selection'),
        field: 'selection',
        width: '80px',
        disabled: true,
      },
      text('position', 100, {
        sortable: true,
        width: '100px',
        showExpand: this.#expandable(),
      }),
      text('name', 100, { sortable: true, disabled: true, width: '100px' }),
      text('weight', 100),
      text('symbol', 100),
      text('gender', 100, {
        formatter: (row: PeriodicElement) => genders[row.gender],
      }),
      text('mobile', 120, { hide: true }),
      text('tele', 120, { width: '120px' }),
      text('birthday', 120),
      text('city', 120),
      text('address', 180, { width: '200px' }),
      text('company', 120),
      text('website', 180),
      text('email', 180),
      {
        header: header('operation'),
        field: 'operation',
        minWidth: 200,
        width: '200px',
        pinned: 'right',
        type: 'button',
        buttons: [
          { type: 'text', text: action('edit'), click: row => this.edit(row) },
          {
            type: 'text',
            color: 'warn',
            text: action('delete'),
            pop: {
              title: action('confirm_delete'),
              closeText: action('cancel'),
              okText: action('delete'),
            },
            click: row => this.delete(row),
          },
        ],
      },
    ];
    const preferences = this.#columnPreferences();
    const ranks = new Map(preferences.map((column, index) => [column.field, index]));
    return columns
      .map(column => {
        const saved = preferences.find(preference => preference.field === column.field);
        const result = saved ? { ...column, ...saved } : column;
        return column.field === 'selection'
          ? {
              ...result,
              hide: !this.options().rowSelectable || this.options().hideRowSelectionCheckbox,
            }
          : result;
      })
      .sort(
        (first, second) =>
          (ranks.get(first.field) ?? columns.length) - (ranks.get(second.field) ?? columns.length)
      );
  });

  protected readonly expanded = linkedSignal({
    source: () => [this.options(), this.elements(), this.columns(), this.selected()],
    computation: () => new Set<number>(),
  });
  protected readonly allSelected = computed(
    () => this.elements().length > 0 && this.selected().length === this.elements().length
  );

  protected isSelected(row: PeriodicElement): boolean {
    return this.selected().some(selected => selected.position === row.position);
  }

  protected selectRow(row: PeriodicElement, checked: boolean): void {
    this.selected.update(rows =>
      checked
        ? this.options().multiSelectable
          ? [...rows.filter(selected => selected.position !== row.position), row]
          : [row]
        : rows.filter(selected => selected.position !== row.position)
    );
  }

  protected selectAll(checked: boolean): void {
    this.selected.set(checked ? [...this.elements()] : []);
  }

  protected toggleExpansion(index: number): void {
    const expanded = this.gridComponent().toggleExpansion(index) as boolean;
    this.expanded.update(indices => {
      const next = new Set(indices);
      if (expanded) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  protected collapseRows(): void {
    for (const index of this.expanded()) this.gridComponent().toggleExpansion(index);
    this.expanded.set(new Set());
  }

  protected sortColumn(column: MtxGridColumn<PeriodicElement>): void {
    const grid = this.gridComponent();
    if (!column.sortable || grid.sortDisabled) return;
    this.collapseRows();
    grid.sort.sort({
      id: column.sortProp?.id || column.field,
      start: column.sortProp?.start ?? grid.sortStart,
      disableClear: column.sortProp?.disableClear ?? grid.sortDisableClear,
    });
  }

  protected pinColumn(column: MtxGridColumn<PeriodicElement>, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value !== 'left' && value !== 'right' && value !== '') return;
    this.updateColumns(
      this.columns().map(current =>
        current.field === column.field ? { ...current, pinned: value || null } : current
      )
    );
  }

  protected updateColumns(columns: MtxGridColumn<PeriodicElement>[]): void {
    this.#columnPreferences.set(
      columns.map(({ field, hide, pinned }) => ({ field, hide, pinned }))
    );
  }

  protected edit(element: PeriodicElement): void {
    this.#dialog
      .open<TablesElementEdit, PeriodicElement, PeriodicElement>(TablesElementEdit, {
        data: element,
        injector: this.#injector,
        width: '480px',
      })
      .afterClosed()
      .subscribe(edited => {
        if (edited) {
          this.elements.update(list => list.map(row => (row === element ? edited : row)));
        }
      });
  }

  protected delete(element: PeriodicElement): void {
    this.elements.update(list => list.filter(row => row !== element));
    this.selected.update(list => list.filter(row => row !== element));
    this.#toaster.success(
      this.#translate.instant('demo.tables.kitchen_sink.deleted', { name: element.name })
    );
    // The row's button had the focus; the grid takes it instead of the page.
    afterNextRender(() => this.grid().nativeElement.focus(), { injector: this.#injector });
  }

  /** New random weights, as if the server had sent new values. */
  protected updateCells(): void {
    this.elements.update(list =>
      list.map(row => ({ ...row, weight: Math.round(Math.random() * 1000) / 100 }))
    );
  }

  /** Moves the last row to the top. */
  protected rotateRows(): void {
    this.elements.update(list => [...list.slice(-1), ...list.slice(0, -1)]);
  }

  protected selectedNames(): string {
    return this.selected()
      .map(row => row.name)
      .join(', ');
  }

  /** A text of the `demo.tables` translations, by its dotted path. */
  #text(path: string): string {
    return textAt(this.#translations(), path);
  }
}
