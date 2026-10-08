/**
 * Unit tests for `MaterialFormField`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/form-field` generated the "should create" test.
 *   2. Replaced it with tests of the options: hiding the required marker and always floating the
 *      label of the fields below them.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MatFormField } from '@angular/material/form-field';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialFormField } from './form-field';

describe('MaterialFormField', () => {
  let fixture: ComponentFixture<MaterialFormField>;
  let host: HTMLElement;

  /** The two form fields of the options card. */
  function optionFields(): MatFormField[] {
    return fixture.debugElement
      .queryAll(By.directive(MatFormField))
      .slice(3, 5)
      .map(field => field.componentInstance);
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(MaterialFormField);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should hide the required marker on demand', async () => {
    expect(optionFields().map(field => field.hideRequiredMarker)).toEqual([false, false]);

    host.querySelector<HTMLInputElement>('.options mat-checkbox input')?.click();
    await fixture.whenStable();

    expect(optionFields().map(field => field.hideRequiredMarker)).toEqual([true, true]);
  });

  it('should float the labels always on demand', async () => {
    expect(optionFields().map(field => field.floatLabel)).toEqual(['auto', 'auto']);

    host.querySelectorAll<HTMLInputElement>('.options mat-radio-button input')[1].click();
    await fixture.whenStable();

    expect(optionFields().map(field => field.floatLabel)).toEqual(['always', 'always']);
  });
});
