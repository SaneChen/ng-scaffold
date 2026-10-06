/**
 * `<app-branding>`: the application logo and name, linking to the home page.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/branding --inline-template --inline-style` generated the
 *      component and its spec.
 *   2. Logo (public/images/logo.svg) through `NgOptimizedImage`, the name from
 *      `PageTitleStrategy.appName` (the `title` signal of `App`), and a `showName` input that the
 *      collapsed side menu turns off.
 *
 * Why: ng-matero hard-coded "MATERO" and linked with `href="/"`, which reloads the application and
 * ignores `<base href>`; `routerLink` navigates inside the app. The logo is decorative next to the
 * name, so its alt text is empty; without the name it carries the link's accessible name.
 */
import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleStrategy } from '@core';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-branding',
  styles: `
    a {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.25rem;
      color: inherit;
      text-decoration: none;
      white-space: nowrap;
      border-radius: var(--mat-sys-corner-full);
    }

    img {
      border-radius: var(--mat-sys-corner-small);
    }

    span {
      font: var(--mat-sys-title-medium);
    }
  `,
  template: `
    <a routerLink="/" [attr.aria-label]="showName() ? null : appName()">
      <img ngSrc="images/logo.svg" width="32" height="32" alt="" />
      @if (showName()) {
        <span>{{ appName() }}</span>
      }
    </a>
  `,
})
export class Branding {
  /** Show the name next to the logo (hidden in the collapsed side menu). */
  readonly showName = input(true);

  protected readonly appName = inject(PageTitleStrategy).appName;
}
