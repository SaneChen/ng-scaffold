/**
 * Grid-list height modes, spans, headers and footers.
 * How this file was built: `yarn ng g component routes/material/grid-list`, then added
 * fixed, ratio and fit-height examples, with local photos instead of remote dog images.
 * Why: every tile uses theme tokens and each static image reserves its intrinsic space.
 */
import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [NgOptimizedImage, MatCardModule, MatGridListModule, TranslatePipe, PageHeader],
  selector: 'app-material-grid-list',
  styleUrl: './grid-list.scss',
  templateUrl: './grid-list.html',
})
export class MaterialGridList {
  protected readonly modes = ['fixed', 'ratio', 'fit'];
  protected readonly tiles = [
    { name: 'espresso', cols: 2, rows: 1 },
    { name: 'latte', cols: 1, rows: 2 },
    { name: 'cappuccino', cols: 1, rows: 1 },
    { name: 'mocha', cols: 1, rows: 1 },
  ];
  protected readonly photos = [21, 22, 23];
}
