/**
 * Unit tests for `TablesElementEdit`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/tables/kitchen-sink/element-edit --flat …` generated the
 *      "should create" test.
 *   2. Replaced it with tests through a dialog opened by `MatDialog`: the element's values, a
 *      required name that keeps the dialog open, and Save closing it with the edited element.
 */
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { TablesElementEdit } from './element-edit';
import { ELEMENTS, PeriodicElement } from './elements';

describe('TablesElementEdit', () => {
  let closed: PeriodicElement | undefined | 'open';
  let dialog: HTMLElement;

  function inputs(): HTMLInputElement[] {
    return Array.from(dialog.querySelectorAll('input'));
  }

  async function stable(): Promise<void> {
    TestBed.tick();
    await new Promise(resolve => setTimeout(resolve));
    TestBed.tick();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        // Close the dialog at once instead of after its exit animation.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      validation: { required: 'Required' },
      demo: { tables: { kitchen_sink: { edit_title: 'Edit element {{position}}' } } },
    });
    translate.use('en');
    closed = 'open';
    TestBed.inject(MatDialog)
      .open<TablesElementEdit, PeriodicElement, PeriodicElement>(TablesElementEdit, {
        data: ELEMENTS[0],
      })
      .afterClosed()
      .subscribe(element => (closed = element));
    await stable();
    const element = document.querySelector<HTMLElement>('app-tables-element-edit');
    if (!element) throw new Error('No dialog');
    dialog = element;
  });

  it('should show the element', () => {
    expect(dialog.querySelector('h2')?.textContent?.trim()).toBe('Edit element 1');
    expect(inputs().map(input => input.value)).toEqual(['Hydrogen', 'H', '1.0079']);
  });

  it('should require a name before closing', async () => {
    inputs()[0].value = '';
    inputs()[0].dispatchEvent(new Event('input'));
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await stable();

    expect(closed).toBe('open');
    expect(dialog.querySelector('mat-error')?.textContent?.trim()).toBe('Required');
    expect(document.activeElement).toBe(inputs()[0]);
  });

  it('should close with the edited element', async () => {
    inputs()[2].value = '1.5';
    inputs()[2].dispatchEvent(new Event('input'));
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await stable();

    expect(closed).toEqual({ ...ELEMENTS[0], weight: 1.5 });
  });
});
