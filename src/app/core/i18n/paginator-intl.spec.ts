/**
 * Unit tests for `PaginatorIntl`.
 *
 * How this file was built:
 *   1. `yarn ng g class core/i18n/paginator-intl` generated a "should create an instance" test.
 *      `PaginatorIntl` now uses `inject()`, so the instance comes from TestBed instead of `new`.
 *   2. Added tests for the translated labels, the reaction to a language switch and the range
 *      label. Translations are set in memory (no loader).
 */
import { TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { PaginatorIntl } from './paginator-intl';

const EN = {
  paginator: {
    items_per_page_label: 'Items per page:',
    next_page_label: 'Next page',
    previous_page_label: 'Previous page',
    first_page_label: 'First page',
    last_page_label: 'Last page',
    range_page_label_1: 'No records',
    range_page_label_2: '{{startIndex}} - {{endIndex}} of {{length}}',
  },
};

describe('PaginatorIntl', () => {
  let intl: MatPaginatorIntl;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: MatPaginatorIntl, useClass: PaginatorIntl },
      ],
    });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', EN);
    translate.use('en-US');
    intl = TestBed.inject(MatPaginatorIntl);
    TestBed.tick();
  });

  it('should create an instance', () => {
    expect(intl).toBeInstanceOf(PaginatorIntl);
  });

  it('should use the translated labels', () => {
    expect(intl.itemsPerPageLabel).toBe('Items per page:');
    expect(intl.nextPageLabel).toBe('Next page');
    expect(intl.previousPageLabel).toBe('Previous page');
    expect(intl.firstPageLabel).toBe('First page');
    expect(intl.lastPageLabel).toBe('Last page');
  });

  it('should relabel and notify paginators when the language changes', () => {
    const changed = vi.fn();
    const subscription = intl.changes.subscribe(changed);

    translate.setTranslation('zh-CN', {
      paginator: { ...EN.paginator, items_per_page_label: '每页条数：', next_page_label: '下一页' },
    });
    translate.use('zh-CN');
    TestBed.tick();

    expect(intl.itemsPerPageLabel).toBe('每页条数：');
    expect(intl.nextPageLabel).toBe('下一页');
    expect(changed).toHaveBeenCalled();
    subscription.unsubscribe();
  });

  it('should translate the range label', () => {
    expect(intl.getRangeLabel(0, 10, 0)).toBe('No records');
    expect(intl.getRangeLabel(0, 10, 25)).toBe('1 - 10 of 25');
    expect(intl.getRangeLabel(2, 10, 25)).toBe('21 - 25 of 25');
    // A page past the end (rows were removed) keeps the requested range.
    expect(intl.getRangeLabel(5, 10, 25)).toBe('51 - 60 of 25');
  });
});
