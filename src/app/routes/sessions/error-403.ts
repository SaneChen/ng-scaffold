/**
 * The 403 page ("Permission denied"), shown when the user lacks a permission (`permissionGuard`, or a GET answered 403).
 *
 * How this file was built:
 *   1. `yarn ng g component routes/sessions/error-403 --flat --inline-template --inline-style`
 *      generated the component and its spec.
 *   2. Renders `ErrorCode` with the translation keys `error.403.title` and
 *      `error.403.message`.
 *
 * Why: ng-matero passed English literals, so the page ignored the language setting.
 */
import { Component } from '@angular/core';
import { ErrorCode } from '@shared';

@Component({
  imports: [ErrorCode],
  selector: 'app-error-403',
  template: `
    <app-error-code code="403" heading="error.403.title" message="error.403.message" />
  `,
})
export class Error403 {}
