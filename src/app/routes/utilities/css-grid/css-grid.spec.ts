/**
 * Unit tests for `UtilitiesCssGrid`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/utilities/css-grid` generated the "should create" test.
 *   2. Replaced it with a test that every example column carries exactly the classes its label
 *      shows, in a `.row` (plus `no-gutters` where the example asks for it).
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EXAMPLES, UtilitiesCssGrid } from './css-grid';

describe('UtilitiesCssGrid', () => {
  it('should render each example column with the classes it names', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(UtilitiesCssGrid);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const rows = Array.from(host.querySelectorAll('mat-card .row'));

    expect(rows).toHaveLength(EXAMPLES.flatMap(example => example.rows).length);
    for (const row of rows) {
      for (const column of Array.from(row.children)) {
        const named = (column.textContent?.trim() ?? '').split(' ').map(name => name.slice(1));
        expect(named.sort()).toEqual(Array.from(column.classList).sort());
      }
    }
    expect(Array.from(rows.at(-1)?.classList ?? []).sort()).toEqual(['no-gutters', 'row']);
  });
});
