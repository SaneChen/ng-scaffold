/**
 * Unit tests for `DesignIcons`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/design/icons` generated the "should create" test.
 *   2. Replaced it with tests against `HttpTestingController`: the names are loaded and paged,
 *      the search filters them (words in any order, spaces or underscores), and a click copies a
 *      name and confirms it.
 */
import { Clipboard } from '@angular/cdk/clipboard';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Toaster } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { DesignIcons, ICONS_PAGE_SIZE } from './icons';

describe('DesignIcons', () => {
  let fixture: ComponentFixture<DesignIcons>;
  const success = vi.fn();
  const NAMES = [
    'arrow_back',
    'arrow_forward',
    'home',
    ...Array.from({ length: ICONS_PAGE_SIZE }, (_, i) => `x${i}`),
  ];

  function names(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('li span')).map(
      span => span.textContent ?? ''
    );
  }

  async function search(value: string): Promise<void> {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    success.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        provideRouter([]),
        { provide: Toaster, useValue: { success } },
      ],
    });
    fixture = TestBed.createComponent(DesignIcons);
    // Start the resource's request; `whenStable()` would wait for the pending response.
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectOne('data/demo/icon-names.json').flush(NAMES);
    await fixture.whenStable();
  });

  it('should show the first page of icons and a paginator', () => {
    expect(names()).toHaveLength(ICONS_PAGE_SIZE);
    expect(fixture.nativeElement.querySelector('mat-paginator')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.count').textContent.trim()).toBe(
      'demo.design.icons.count'
    );
  });

  it('should filter by words in any order', async () => {
    await search('back arrow');
    expect(names()).toEqual(['arrow_back']);

    await search('ARROW_');
    expect(names()).toEqual(['arrow_back', 'arrow_forward']);
    expect(fixture.nativeElement.querySelector('mat-paginator')).toBeNull();

    await search('nothing');
    expect(names()).toEqual([]);
    expect(fixture.nativeElement.querySelector('.count').textContent.trim()).toBe(
      'demo.design.icons.none'
    );
  });

  it('should copy a name and confirm it', async () => {
    const copy = vi.spyOn(TestBed.inject(Clipboard), 'copy').mockReturnValue(true);
    await search('home');

    fixture.nativeElement.querySelector('li button').click();

    expect(copy).toHaveBeenCalledWith('home');
    expect(success).toHaveBeenCalledWith('demo.design.icons.copied');
  });

  it('should report a failed icon request without reading an errored resource and allow retry', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(DesignIcons);
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('data/demo/icon-names.json')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(names()).toEqual([]);
    const alert: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('demo.design.icons.failed');
    alert.querySelector<HTMLButtonElement>('button')!.click();
    TestBed.tick();
    http.expectOne('data/demo/icon-names.json').flush(NAMES);
    await fixture.whenStable();
    expect(names()).toHaveLength(ICONS_PAGE_SIZE);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    http.verify();
  });
});
