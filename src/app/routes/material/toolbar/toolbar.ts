/**
 * Toolbar demo (`/material/toolbar`): `mat-toolbar` with a title, several rows, actions and
 * colours.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/toolbar` generated the component, template, styles and
 *      spec; the class was renamed `MaterialToolbar`.
 *   2. The favourite button is a toggle (`aria-pressed`); the colours use the official
 *      `mat.toolbar-overrides()` mixin with system tokens.
 *
 * Why: ng-matero put an `h1` in every toolbar (several per page), gave a toolbar the heading
 * role and used the M2 `color` input, which M3 ignores.
 */
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-material-toolbar',
  styleUrl: './toolbar.scss',
  templateUrl: './toolbar.html',
})
export class MaterialToolbar {
  protected readonly favorite = signal(false);
  protected readonly colors = ['primary', 'tertiary'];
}
