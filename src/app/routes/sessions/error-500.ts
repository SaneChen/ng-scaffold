/**
 * The 500 page ("Server error"), shown when a GET answered 500.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/error-500 --flat --inline-template --inline-style`
 *      generated the component and its spec.
 *   2. Renders `ErrorCode` with the translation keys `error.500.title` and
 *      `error.500.message`.
 *
 * Why: ng-matero passed English literals, so the page ignored the language setting.
 */
import { Component } from '@angular/core';
import { ErrorCode } from '@shared';

@Component({
  imports: [ErrorCode],
  selector: 'app-error-500',
  template: `
    <app-error-code code="500" heading="error.500.title" message="error.500.message" />
  `,
})
export class Error500 {}
