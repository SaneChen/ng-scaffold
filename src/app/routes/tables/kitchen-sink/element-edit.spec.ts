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
import { ApplicationRef } from '@angular/core';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { TablesElementEdit } from './element-edit';
import { ELEMENTS, PeriodicElement } from './elements';

describe('TablesElementEdit', () => {
  let closed: PeriodicElement | undefined | 'open';
  let dialog: HTMLElement;
  let reference: MatDialogRef<TablesElementEdit, PeriodicElement>;

  function inputs(): HTMLInputElement[] {
    return Array.from(dialog.querySelectorAll('input'));
  }

  async function stable(): Promise<void> {
    TestBed.tick();
    await TestBed.inject(ApplicationRef).whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        // Close the dialog at once instead of after its exit animation.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        {
          provide: InteractivityChecker,
          useValue: {
            isDisabled: (element: HTMLElement) => element.hasAttribute('disabled'),
            isVisible: () => true,
            isFocusable: (element: HTMLElement) =>
              ['BUTTON', 'INPUT', 'A'].includes(element.tagName) &&
              !element.hasAttribute('disabled'),
            isTabbable: (element: HTMLElement) =>
              ['BUTTON', 'INPUT', 'A'].includes(element.tagName) &&
              !element.hasAttribute('disabled'),
          },
        },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      validation: { required: 'Required' },
      demo: { tables: { kitchen_sink: { edit_title: 'Edit element {{position}}' } } },
    });
    translate.use('en');
    closed = 'open';
    reference = TestBed.inject(MatDialog).open<TablesElementEdit, PeriodicElement, PeriodicElement>(
      TablesElementEdit,
      { data: ELEMENTS[0] }
    );
    reference.afterClosed().subscribe(element => (closed = element));
    TestBed.tick();
    await firstValueFrom(reference.afterOpened());
    await stable();
    const element = document.querySelector<HTMLElement>('app-tables-element-edit');
    if (!element) throw new Error('No dialog');
    dialog = element;
    await expect.poll(() => document.activeElement).toBe(inputs()[0]);
  });

  it('should show the element', () => {
    expect(dialog.querySelector('h2')?.textContent?.trim()).toBe('Edit element 1');
    expect(inputs().map(input => input.value)).toEqual(['Hydrogen', 'H', '1.0079']);
  });

  it('should require a name before closing', async () => {
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
    inputs()[0].value = '';
    inputs()[0].dispatchEvent(new Event('input'));
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await stable();

    expect(closed).toBe('open');
    expect(dialog.querySelector('mat-error')?.textContent?.trim()).toBe('Required');
    expect(document.activeElement).toBe(inputs()[0]);
  });

  it('should close with the edited element', async () => {
    const completed = firstValueFrom(reference.afterClosed());
    inputs()[2].value = '1.5';
    inputs()[2].dispatchEvent(new Event('input'));
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await completed;
    await stable();

    expect(closed).toEqual({ ...ELEMENTS[0], weight: 1.5 });
  });
});
