/**
 * Sidenav demo index (`/material/sidenav`): links to the three `mat-sidenav` examples.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/sidenav` generated the component, template, styles and
 *      spec; the class was renamed `MaterialSidenav`.
 *   2. One card per example (examples.ts) with a description and a link whose text names it.
 *
 * Why: ng-matero's links all read "View example" (with an `aria-label` that differed from the
 * visible text) and used the M2 `color` input.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { SIDENAV_EXAMPLES } from './examples';

@Component({
  imports: [MatButtonModule, MatCardModule, PageHeader, RouterLink, TranslatePipe],
  selector: 'app-material-sidenav',
  styleUrl: './sidenav.scss',
  templateUrl: './sidenav.html',
})
export class MaterialSidenav {
  protected readonly examples = SIDENAV_EXAMPLES;
}
