/**
 * Unit tests for `MaterialToolbar`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/toolbar` generated the "should create" test.
 *   2. Replaced it with tests of the favourite toggle and of toolbars without headings (the page
 *      header has the page's only `h1`).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialToolbar } from './toolbar';

describe('MaterialToolbar', () => {
  let fixture: ComponentFixture<MaterialToolbar>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(MaterialToolbar);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should toggle the favourite', async () => {
    const button = host.querySelector<HTMLButtonElement>('mat-toolbar button');
    expect(button?.getAttribute('aria-label')).toBe('demo.material.toolbar.actions.favorite');
    expect(button?.getAttribute('aria-pressed')).toBe('false');

    button?.click();
    await fixture.whenStable();

    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should keep headings out of the toolbars', () => {
    expect(host.querySelectorAll('mat-toolbar h1, mat-toolbar h2')).toHaveLength(0);
  });
});
