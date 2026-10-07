/**
 * `validationMessage`: turns a Signal Forms validation error into a translation key and its
 * parameters, for `{{ m.key | translate: m.params }}`.
 *
 * How this file was built:
 *   1. `yarn ng g pipe shared/pipes/validation-message` generated the pipe and its spec.
 *   2. `transform()` returns the error's own `message` (a translation key set in the schema, or a
 *      server message, which the translate pipe shows as is), else the `validation.*` key of the
 *      built-in kinds with the limit as `{{number}}`, else `validation.invalid`.
 *
 * Why: Signal Forms' built-in errors carry no translated text. Mapping them in one pure pipe keeps
 * templates to one line per field and lets the translation follow the language setting (the
 * translate pipe re-renders, this pipe does not need to).
 */
import { Pipe, PipeTransform } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';

/** A translation key with its interpolation parameters. */
export interface ValidationMessage {
  key: string;
  params?: Record<string, unknown>;
}

const KEYS: Record<string, string> = {
  required: 'validation.required',
  email: 'validation.invalid_email',
  minLength: 'validation.min_length',
  maxLength: 'validation.max_length',
  min: 'validation.min',
  max: 'validation.max',
  pattern: 'validation.pattern',
};

@Pipe({
  name: 'validationMessage',
})
export class ValidationMessagePipe implements PipeTransform {
  transform(error: ValidationError): ValidationMessage {
    if (error.message) {
      return { key: error.message };
    }
    const limit = limitOf(error);
    return {
      key: KEYS[error.kind] ?? 'validation.invalid',
      params: limit === undefined ? undefined : { number: limit },
    };
  }
}

function limitOf(error: ValidationError): unknown {
  const { minLength, maxLength, min, max } = error as Partial<
    Record<'minLength' | 'maxLength' | 'min' | 'max', unknown>
  >;
  return minLength ?? maxLength ?? min ?? max;
}
