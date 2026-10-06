/**
 * Unit tests for `SessionStorage`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/storage/session-storage` generated the "should be created" test.
 *   2. Added a round trip that proves the values land in `sessionStorage`, not `localStorage`
 *      (the shared JSON and failure handling is covered by local-storage.spec.ts).
 */
import { TestBed } from '@angular/core/testing';
import { SessionStorage } from './session-storage';

describe('SessionStorage', () => {
  let service: SessionStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionStorage);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should keep values in sessionStorage only', () => {
    service.set('token', { access_token: 'abc' });

    expect(sessionStorage.getItem('token')).toBe('{"access_token":"abc"}');
    expect(localStorage.getItem('token')).toBeNull();
    expect(service.get('token', null)).toEqual({ access_token: 'abc' });
  });
});
