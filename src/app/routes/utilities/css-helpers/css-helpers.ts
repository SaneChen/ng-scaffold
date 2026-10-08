/**
 * CSS helpers demo (`/utilities/css-helpers`): every helper class of src/styles/helpers and
 * src/styles/colors with the declaration it applies, searchable.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/utilities/css-helpers` generated the component, template,
 *      styles and spec; the class was renamed `UtilitiesCssHelpers`.
 *   2. `readHelpers()` walks the loaded stylesheets once: every top-level single-class rule that
 *      is not Material's, CDK's or the application's own is a helper; its first property decides
 *      its group (spacing, display, flexbox…). Responsive variants inside media queries are left
 *      out (the page explains the `-sm-` … `-xl-` infixes).
 *   3. Groups in tabs with lazily rendered tables; a search field filters by class or declaration.
 *
 * Why: ng-matero listed the classes by hand, which drifted from the stylesheet (it still listed
 * M2 palettes it no longer generates). Reading the rules shows exactly what exists.
 */
import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';

export interface HelperRule {
  /** Class name without the dot. */
  name: string;
  /** Declarations without `!important`, e.g. `margin-block-start: 8px`. */
  css: string;
}

export interface HelperGroup {
  /** Translation key below `demo.utilities.helpers.groups`. */
  key: string;
  rules: HelperRule[];
}

/** Groups in display order, with the CSS properties that put a rule into them. */
const GROUPS: [key: string, test: RegExp][] = [
  ['spacing', /^(margin|padding|gap|row-gap|column-gap)/],
  ['display', /^display$/],
  ['flexbox', /^(flex|justify-|align-items|align-content|align-self|order)/],
  ['sizing', /^(width|height|min-|max-|inline-size|block-size)/],
  ['rounded', /radius$/],
  ['border', /^border/],
  ['text', /^(font|text-|white-space|overflow-wrap|word-|line-height|letter-spacing)/],
  ['colors', /^(color|background-color)$/],
  [
    'layout',
    /^(position|overflow|vertical-align|object-|cursor|user-select|pointer-events|visibility|z-index|inset)/,
  ],
];

/** Single-class rules of libraries and of the application itself, not helpers. */
const NOT_HELPERS =
  /^(mat-|mdc-|cdk-|mtx-|ng-|formly-|material-symbols|theme-|global-loader|matero-|hot-toast|photoviewer-|demo-|row$|no-gutters$|col|offset-)/;

/** Collects the helper classes of the loaded stylesheets, grouped. */
export function readHelpers(document: Document): HelperGroup[] {
  const groups = new Map<string, HelperRule[]>(GROUPS.map(([key]) => [key, []]));
  const seen = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // A cross-origin stylesheet cannot be read.
    }
    for (const rule of Array.from(rules)) {
      const name = /^\.([a-z][\w-]*)$/.exec((rule as CSSStyleRule).selectorText ?? '')?.[1];
      if (!name || NOT_HELPERS.test(name) || seen.has(name)) {
        continue;
      }
      const style = (rule as CSSStyleRule).style;
      const property = style.item(0);
      const group = GROUPS.find(([, test]) => test.test(property))?.[0];
      if (group) {
        seen.add(name);
        // `cssText` keeps shorthands (`margin: 0`), where `item()` lists the physical longhands.
        const css = style.cssText.replace(/\s*!important/g, '').replace(/;\s*$/, '');
        groups.get(group)?.push({ name, css });
      }
    }
  }
  return GROUPS.map(([key]) => ({ key, rules: groups.get(key) ?? [] })).filter(
    group => group.rules.length > 0
  );
}

@Component({
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-utilities-css-helpers',
  styleUrl: './css-helpers.scss',
  templateUrl: './css-helpers.html',
})
export class UtilitiesCssHelpers {
  readonly #groups = readHelpers(inject(DOCUMENT));

  protected readonly query = signal('');

  protected readonly groups = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.#groups.map(group => ({
      ...group,
      rules: query
        ? group.rules.filter(rule => rule.name.includes(query) || rule.css.includes(query))
        : group.rules,
    }));
  });

  protected search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
