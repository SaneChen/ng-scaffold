/**
 * Unit tests for `MaterialCheckbox`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/checkbox` generated the "should create" test.
 *   2. Replaced it with tests of the nested checklist: a parent sets its tasks, and some checked
 *      tasks make it indeterminate, all of them checked.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialCheckbox } from './checkbox';

describe('MaterialCheckbox', () => {
  let fixture: ComponentFixture<MaterialCheckbox>;
  let list: HTMLElement;

  function parent(): HTMLInputElement {
    return list.querySelector(':scope > mat-checkbox input') as HTMLInputElement;
  }

  function tasks(): HTMLInputElement[] {
    return Array.from(list.querySelectorAll('li input'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(MaterialCheckbox);
    await fixture.whenStable();
    list = fixture.nativeElement.querySelector('.list');
  });

  it('should check every task with their list', async () => {
    parent().click();
    await fixture.whenStable();

    expect(tasks().map(task => task.checked)).toEqual([true, true, true]);

    parent().click();
    await fixture.whenStable();
    expect(tasks().map(task => task.checked)).toEqual([false, false, false]);
  });

  it('should show a partly done list as indeterminate and a done one as checked', async () => {
    tasks()[0].click();
    await fixture.whenStable();
    expect(parent().indeterminate).toBe(true);
    expect(parent().checked).toBe(false);

    tasks()[1].click();
    tasks()[2].click();
    await fixture.whenStable();
    expect(parent().indeterminate).toBe(false);
    expect(parent().checked).toBe(true);
  });
});
