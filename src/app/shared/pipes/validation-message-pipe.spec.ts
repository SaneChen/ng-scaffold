/**
 * Unit tests for `ValidationMessagePipe`.
 *
 * How this file was built:
 *   1. `yarn ng g pipe shared/pipes/validation-message` generated the "create an instance" test.
 *   2. Replaced it with tests on the errors of a real Signal Forms field: built-in kinds, limits as
 *      parameters (lengths and numbers), patterns, messages set in the schema, and unknown kinds.
 */
import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  email,
  form,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { ValidationMessagePipe } from './validation-message-pipe';

describe('ValidationMessagePipe', () => {
  const pipe = new ValidationMessagePipe();

  function messages(value: string) {
    const model = signal({ name: value, mail: value });
    const field = form(
      model,
      path => {
        required(path.name);
        minLength(path.name, 3);
        maxLength(path.name, 1);
        email(path.mail, { message: 'custom.key' });
        validate(path.mail, () => ({ kind: 'mine' }));
      },
      { injector: TestBed.inject(Injector) }
    );
    return [...field.name().errors(), ...field.mail().errors()].map(error => pipe.transform(error));
  }

  it('should map built-in errors to validation keys with their limits', () => {
    expect(messages('')).toContainEqual({ key: 'validation.required', params: undefined });
    expect(messages('ab')).toContainEqual({ key: 'validation.min_length', params: { number: 3 } });
    expect(messages('ab')).toContainEqual({ key: 'validation.max_length', params: { number: 1 } });
  });

  it('should prefer the message of the error and fall back for unknown kinds', () => {
    expect(messages('ab')).toContainEqual({ key: 'custom.key' });
    expect(messages('ab')).toContainEqual({ key: 'validation.invalid', params: undefined });
  });

  it('should map numeric limits and patterns', () => {
    const field = form(
      signal({ low: 1, high: 9, code: 'x' }),
      path => {
        min(path.low, 2);
        max(path.high, 8);
        pattern(path.code, /^\d+$/);
      },
      { injector: TestBed.inject(Injector) }
    );

    expect(pipe.transform(field.low().errors()[0])).toEqual({
      key: 'validation.min',
      params: { number: 2 },
    });
    expect(pipe.transform(field.high().errors()[0])).toEqual({
      key: 'validation.max',
      params: { number: 8 },
    });
    expect(pipe.transform(field.code().errors()[0])).toEqual({
      key: 'validation.pattern',
      params: undefined,
    });
  });
});
