/**
 * Unit tests for `TablesKitchenSink`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/tables/kitchen-sink` generated the "should create" test.
 *   2. Replaced it with tests through the grid, the option checkboxes and the dialogs: translated
 *      headers and genders, an option passed to the grid, the expandable first column, an edit
 *      saved from the dialog, a confirmed delete (toast, focus on the grid) and the row rotation.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Toaster } from '@core';
import { MtxGrid } from '@ng-matero/extensions/grid';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ELEMENTS, PeriodicElement } from './elements';
import { TablesKitchenSink } from './kitchen-sink';

describe('TablesKitchenSink', () => {
  let fixture: ComponentFixture<TablesKitchenSink>;
  let host: HTMLElement;
  const success = vi.fn();

  function grid(): MtxGrid {
    return fixture.debugElement.query(By.directive(MtxGrid)).componentInstance;
  }

  function rows(): PeriodicElement[] {
    return grid().data as PeriodicElement[];
  }

  function button(root: ParentNode, text: string): HTMLButtonElement {
    const found = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      candidate => candidate.textContent?.trim() === text
    );
    if (!found) throw new Error(`No button ${text}`);
    return found;
  }

  beforeEach(async () => {
    success.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: Toaster, useValue: { success } },
        // Close the dialogs at once instead of after their exit animations.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      save: 'Save',
      demo: {
        tables: {
          columns: { name: 'Name', gender: 'Gender' },
          genders: { male: 'Male', female: 'Female' },
          kitchen_sink: {
            pin: { left: 'Pin left', right: 'Pin right', none: 'Unpin' },
            option: { rowStriped: 'Striped rows', expandable: 'Expandable rows' },
            edit: 'Edit',
            delete: 'Delete',
            rotate_rows: 'Rotate',
            deleted: '{{name}} was deleted.',
          },
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(TablesKitchenSink);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should show the elements with translated headers and genders', () => {
    const column = (field: string) => grid().columns.find(col => col.field === field);

    expect(rows()).toHaveLength(ELEMENTS.length);
    expect(column('name')?.header).toBe('Name');
    expect(column('gender')?.formatter?.(ELEMENTS[1])).toBe('Female');
  });

  it('should translate the column pin menu when the language changes', async () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('zh-CN', {
      demo: {
        tables: {
          kitchen_sink: { pin: { left: '固定到左侧', right: '固定到右侧', none: '取消固定' } },
        },
      },
    });
    await fixture.whenStable();
    button(host, 'demo.tables.kitchen_sink.columns').click();
    await fixture.whenStable();
    document.querySelector<HTMLButtonElement>('.mtx-grid-column-pin-button')!.click();
    await fixture.whenStable();
    expect(document.querySelector('.mtx-grid-column-pin-list')?.textContent).toContain('Pin left');
    translate.use('zh-CN');
    await fixture.whenStable();
    expect(document.querySelector('.mtx-grid-column-pin-list')?.textContent).toContain(
      '固定到左侧'
    );
    expect(grid().columnPinOptions.map(option => option.label)).toEqual([
      '固定到左侧',
      '固定到右侧',
      '取消固定',
    ]);
  });

  it('should pass the options to the grid', async () => {
    const checkbox = (text: string) =>
      Array.from(host.querySelectorAll('mat-checkbox'))
        .find(box => box.textContent?.trim() === text)
        ?.querySelector('input');
    expect(grid().rowStriped).toBe(false);

    checkbox('Striped rows')?.click();
    checkbox('Expandable rows')?.click();
    await fixture.whenStable();

    expect(grid().rowStriped).toBe(true);
    expect(grid().expandable).toBe(true);
    expect(grid().columns[0].showExpand).toBe(true);
  });

  it('should preserve selection when options or row objects change, and trim it for single selection', async () => {
    const checkboxes = () =>
      host.querySelectorAll<HTMLInputElement>('mtx-grid tbody input[type="checkbox"]');
    checkboxes()[0].click();
    checkboxes()[1].click();
    await fixture.whenStable();
    expect(grid().rowSelected.map((row: PeriodicElement) => row.position)).toEqual([1, 2]);
    const striped = Array.from(host.querySelectorAll('mat-checkbox')).find(
      box => box.textContent?.trim() === 'Striped rows'
    )!;
    striped.querySelector<HTMLInputElement>('input')!.click();
    await fixture.whenStable();
    expect(checkboxes()[0].checked).toBe(true);
    expect(checkboxes()[1].checked).toBe(true);
    button(host, 'demo.tables.kitchen_sink.update_cells').click();
    await fixture.whenStable();
    expect(grid().rowSelected[0]).toBe(rows()[0]);
    expect(checkboxes()[0].checked).toBe(true);
    host.querySelector<HTMLInputElement>('mat-radio-button input')!.click();
    await fixture.whenStable();
    expect(grid().rowSelected).toHaveLength(1);
    expect(host.querySelector('.selection')?.textContent).toContain('Hydrogen');
  });

  it('should preserve column visibility, order and pinning when unrelated options and labels change', async () => {
    const symbol = grid().columns.find(column => column.field === 'symbol')!;
    grid().columnChange.emit([
      { ...symbol, hide: true, pinned: 'left' },
      ...grid().columns.filter(column => column !== symbol),
    ]);
    await fixture.whenStable();
    expect(grid().columns[0].field).toBe('symbol');
    const striped = Array.from(host.querySelectorAll('mat-checkbox')).find(
      box => box.textContent?.trim() === 'Striped rows'
    )!;
    striped.querySelector<HTMLInputElement>('input')!.click();
    await fixture.whenStable();
    const retained = () => grid().columns.find(column => column.field === 'symbol')!;
    expect(retained().hide).toBe(true);
    expect(retained().pinned).toBe('left');
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('zh-CN', { demo: { tables: { columns: { symbol: '符号' } } } });
    translate.use('zh-CN');
    await fixture.whenStable();
    expect(grid().columns[0].field).toBe('symbol');
    expect(retained().header).toBe('符号');
    expect(retained().hide).toBe(true);
    expect(retained().pinned).toBe('left');
  });

  it('should save an edit from the dialog', async () => {
    button(host, 'Edit').click();
    await fixture.whenStable();
    const dialog = document.querySelector('app-tables-element-edit');
    const name = dialog?.querySelector('input');
    if (!dialog || !name) throw new Error('No edit dialog');

    name.value = 'Hydrogenium';
    name.dispatchEvent(new Event('input'));
    button(dialog, 'Save').click();
    await fixture.whenStable();

    expect(rows()[0]).toEqual({ ...ELEMENTS[0], name: 'Hydrogenium' });
    expect(rows()[1]).toBe(ELEMENTS[1]);
  });

  it('should delete an element after the confirmation', async () => {
    button(host, 'Delete').click();
    await fixture.whenStable();
    const confirmation = document.querySelector('.cdk-overlay-container');
    if (!confirmation) throw new Error('No confirmation');

    button(confirmation, 'Delete').click();
    await fixture.whenStable();

    expect(rows().map(row => row.name)).not.toContain('Hydrogen');
    expect(success).toHaveBeenCalledWith('Hydrogen was deleted.');
    expect(document.activeElement).toBe(host.querySelector('mtx-grid'));
  });

  it('should move the last row to the top', async () => {
    button(host, 'Rotate').click();
    await fixture.whenStable();

    expect(rows()[0]).toBe(ELEMENTS.at(-1));
    expect(rows()[1]).toBe(ELEMENTS[0]);
  });
});
