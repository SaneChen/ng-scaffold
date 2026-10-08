/**
 * Unit tests for `UtilitiesCssHelpers` and `readHelpers()`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/utilities/css-helpers` generated the "should create" test.
 *   2. Replaced it with tests on a stylesheet added to the test document: helpers grouped by their
 *      first property with shorthands kept and `!important` dropped; library, application and
 *      grid classes, compound selectors and media-query variants left out; the search filter.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { readHelpers, UtilitiesCssHelpers } from './css-helpers';

describe('UtilitiesCssHelpers', () => {
  let style: HTMLStyleElement;

  beforeEach(() => {
    style = document.head.appendChild(document.createElement('style'));
    style.textContent = `
      .m-8 { margin: 0.5rem !important; }
      .d-flex { display: flex !important; }
      .bg-red-40 { background-color: #c00100 !important; }
      .text-center { text-align: center !important; }
      .mat-mdc-button { display: inline-flex; }
      .cdk-visually-hidden { position: absolute; }
      .photoviewer-modal { position: absolute; }
      .photoviewer-stage { overflow: hidden; }
      .demo-sheet-backdrop { background-color: purple; }
      .mtx-grid-toolbar { display: flex; }
      .formly-field { display: block; }
      .col-6 { --col-span: 6; }
      .row > .col { display: block; }
      @media (min-width: 600px) { .d-sm-none { display: none !important; } }
    `;
  });

  afterEach(() => style.remove());

  it('should group the helper rules and leave other classes out', () => {
    const groups = readHelpers(document);
    const names = (key: string) => groups.find(group => group.key === key)?.rules;

    expect(names('spacing')).toEqual([{ name: 'm-8', css: 'margin: 0.5rem' }]);
    expect(names('display')).toEqual([{ name: 'd-flex', css: 'display: flex' }]);
    expect(names('colors')?.map(rule => rule.name)).toEqual(['bg-red-40']);
    expect(names('text')?.map(rule => rule.name)).toEqual(['text-center']);
    expect(groups.flatMap(group => group.rules).map(rule => rule.name)).not.toContain(
      'mat-mdc-button'
    );
    for (const excluded of [
      'photoviewer-modal',
      'photoviewer-stage',
      'demo-sheet-backdrop',
      'mtx-grid-toolbar',
      'formly-field',
    ]) {
      expect(groups.flatMap(group => group.rules).map(rule => rule.name)).not.toContain(excluded);
    }
  });

  it('should filter the rules by class or declaration', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(UtilitiesCssHelpers);
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.value = 'flex';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const labels = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[role="tab"]'));
    expect(labels.map(label => label.textContent?.trim().replace(/^\S+ /, ''))).toEqual([
      '(0)',
      '(1)',
      '(0)',
      '(0)',
    ]);
  });
});
