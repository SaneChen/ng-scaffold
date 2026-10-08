/**
 * CSS grid demo (`/utilities/css-grid`): the `row` / `col-*` / `offset-*` classes of
 * src/styles/grid at every breakpoint.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/utilities/css-grid` generated the component, template, styles
 *      and spec; the class was renamed `UtilitiesCssGrid`.
 *   2. The examples are data (`EXAMPLES`): each card renders its rows with the listed classes
 *      and labels every column with them, so what is shown is what is applied.
 *
 * Why: ng-matero repeated the class names by hand in the markup and described the breakpoints of
 * the retired flex-layout library; the texts are translated here.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';

export interface GridExample {
  /** Translation key below `demo.utilities.grid.examples`. */
  key: string;
  rowClass?: string;
  rows: string[][];
}

export const EXAMPLES: GridExample[] = [
  {
    key: 'all',
    rows: [
      ['col', 'col', 'col', 'col'],
      ['col-8', 'col-4'],
    ],
  },
  {
    key: 'stacked',
    rows: [
      ['col-sm-8', 'col-sm-4'],
      ['col-sm', 'col-sm', 'col-sm'],
    ],
  },
  {
    key: 'mixed',
    rows: [
      ['col-md-8', 'col-6 col-md-4'],
      ['col-6 col-md-4', 'col-6 col-md-4', 'col-6 col-md-4'],
      ['col-6', 'col-6'],
    ],
  },
  {
    key: 'offset',
    rows: [
      ['col-md-4', 'col-md-4 offset-md-4'],
      ['col-md-3 offset-md-3', 'col-md-3 offset-md-3'],
      ['col-md-6 offset-md-3'],
    ],
  },
  {
    key: 'gutters',
    rowClass: 'no-gutters',
    rows: [['col-sm-6 col-md-8', 'col-6 col-md-4']],
  },
];

/** The breakpoints of src/styles/_breakpoints.scss. */
export const BREAKPOINTS = [
  { infix: 'sm', width: 600 },
  { infix: 'md', width: 960 },
  { infix: 'lg', width: 1280 },
  { infix: 'xl', width: 1920 },
];

@Component({
  imports: [MatCardModule, PageHeader, RouterLink, TranslatePipe],
  selector: 'app-utilities-css-grid',
  styleUrl: './css-grid.scss',
  templateUrl: './css-grid.html',
})
export class UtilitiesCssGrid {
  protected readonly examples = EXAMPLES;
  protected readonly breakpoints = BREAKPOINTS;
}
