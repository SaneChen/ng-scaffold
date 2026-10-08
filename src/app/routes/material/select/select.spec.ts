/**
 * Unit tests for `MaterialSelect`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/select` generated the "should create" test.
 *   2. Replaced it with tests through the opened selects: translated options, several toppings
 *      selected at once, and the disabled group.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialSelect, PRODUCE } from './select';

describe('MaterialSelect', () => {
  let fixture: ComponentFixture<MaterialSelect>;

  async function open(index: number): Promise<HTMLElement> {
    const select = fixture.nativeElement.querySelectorAll('mat-select')[index] as HTMLElement;
    select.click();
    await fixture.whenStable();
    return select;
  }

  function options(): HTMLElement[] {
    return Array.from(document.querySelectorAll('mat-option'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(MaterialSelect);
    await fixture.whenStable();
  });

  it('should translate the options', async () => {
    await open(0);

    expect(options()[0].textContent?.trim()).toBe('demo.material.select.colors.red');
  });

  it('should select several toppings', async () => {
    const select = await open(1);

    options()[0].click();
    options()[1].click();
    await fixture.whenStable();

    expect(select.textContent).toContain('demo.material.select.toppings.pepperoni');
    expect(select.textContent).toContain('demo.material.select.toppings.mushrooms');
  });

  it('should disable the out-of-stock group', async () => {
    await open(2);

    const groups = Array.from(document.querySelectorAll('mat-optgroup'));
    expect(groups.map(group => group.getAttribute('aria-disabled'))).toEqual(
      PRODUCE.map(group => String(group.disabled))
    );
  });
});
