/**
 * The 404 page ("Page not found"), shown when no route matches the URL, or a GET answered 404.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/error-404 --flat --inline-template --inline-style`
 *      generated the component and its spec.
 *   2. Renders `ErrorCode` with the translation keys `error.404.title` and
 *      `error.404.message`.
 *
 * Why: ng-matero passed English literals, so the page ignored the language setting.
 */
import { Component } from '@angular/core';
import { ErrorCode } from '@shared';

@Component({
  imports: [ErrorCode],
  selector: 'app-error-404',
  template: `
    <app-error-code code="404" heading="error.404.title" message="error.404.message" />
  `,
})
export class Error404 {}
