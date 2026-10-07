/**
 * Unit tests for `serverErrors()`.
 *
 * How this file was built: written by hand with the move of the function to shared: field
 * errors of a 422, errors without a matching field, other statuses and non-HTTP errors.
 */
import { HttpErrorResponse } from '@angular/common/http';
import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { serverErrors } from './server-errors';

describe('serverErrors', () => {
  function fields() {
    const tree = form(signal({ name: '' }), { injector: TestBed.inject(Injector) });
    return { tree, fields: { name: tree.name } };
  }

  function unprocessable(error: unknown) {
    return new HttpErrorResponse({ status: 422, error });
  }

  it('should put the texts of a 422 on their fields and the rest on the form', () => {
    const { tree, fields: map } = fields();

    const errors = serverErrors(
      unprocessable({ errors: { name: ['Taken.', 'Too short.'], constructor: 'Odd.' } }),
      map
    );

    expect(errors.map(e => [e.message, e.fieldTree])).toEqual([
      ['Taken.', tree.name],
      ['Too short.', tree.name],
      ['Odd.', undefined],
    ]);
  });

  it('should fall back to the message, then to a translation key', () => {
    const { fields: map } = fields();

    expect(serverErrors(unprocessable({ message: 'Invalid.' }), map)).toEqual([
      { kind: 'server', message: 'Invalid.' },
    ]);
    expect(serverErrors(new HttpErrorResponse({ status: 500 }), map)).toEqual([
      { kind: 'server', message: 'http.failed' },
    ]);
    expect(serverErrors(new HttpErrorResponse({ status: 0 }), map)).toEqual([
      { kind: 'server', message: 'http.network_error' },
    ]);
  });

  it('should rethrow errors that are not HTTP responses', () => {
    const bug = new TypeError('bug');

    expect(() => serverErrors(bug, fields().fields)).toThrow(bug);
  });
});
