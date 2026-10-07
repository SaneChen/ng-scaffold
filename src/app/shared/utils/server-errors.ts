/**
 * `serverErrors()`: turns a refused form request into Signal Forms errors.
 *
 * How this file was built: written by hand (a plain function) for the login and sign-up pages,
 * then moved from routes/sessions to shared for the profile settings form.
 *
 * Why: such requests opt out of the global error toasts (`HANDLE_HTTP_ERRORS`), so the form
 * shows the errors itself. A 422 body `{ message, errors: { field: [text] } }` (Laravel style, as
 * in ng-matero and the mock API) puts each text on its field; anything else becomes a form-level
 * error with a translation key. Messages from the server are shown as is: the API receives the
 * `Accept-Language` header and can localize them.
 */
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ReadonlyFieldTree, ValidationError } from '@angular/forms/signals';

export function serverErrors(
  error: unknown,
  fields: Readonly<Record<string, ReadonlyFieldTree<unknown>>>
): ValidationError.WithOptionalFieldTree[] {
  if (!(error instanceof HttpErrorResponse)) {
    throw error;
  }
  if (error.status === HttpStatusCode.UnprocessableEntity) {
    const { message, errors } = (error.error ?? {}) as { message?: unknown; errors?: unknown };
    const perField = Object.entries(isRecord(errors) ? errors : {}).flatMap(([name, texts]) =>
      (Array.isArray(texts) ? texts : [texts])
        .filter((text): text is string => typeof text === 'string')
        .map(text => ({
          kind: 'server',
          message: text,
          // Errors on fields the form does not have are shown with the form.
          fieldTree: Object.hasOwn(fields, name) ? fields[name] : undefined,
        }))
    );
    if (perField.length > 0) {
      return perField;
    }
    if (typeof message === 'string') {
      return [{ kind: 'server', message }];
    }
  }
  return [{ kind: 'server', message: error.status === 0 ? 'http.network_error' : 'http.failed' }];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
