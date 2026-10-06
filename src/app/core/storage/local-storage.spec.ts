/**
 * Unit tests for `LocalStorage`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/storage/local-storage` generated the "should be created" test.
 *   2. Added round-trip, fallback, `undefined` and failure tests. jsdom provides a real
 *      `localStorage`; the failure cases replace `DOCUMENT` with a stub whose storage throws.
 */
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocalStorage } from './local-storage';

describe('LocalStorage', () => {
  let service: LocalStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorage);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store values as JSON and read them back with their type', () => {
    expect(service.set('prefs', { dir: 'rtl', count: 2 })).toBe(true);

    expect(localStorage.getItem('prefs')).toBe('{"dir":"rtl","count":2}');
    expect(service.get('prefs', { dir: 'ltr', count: 0 })).toEqual({ dir: 'rtl', count: 2 });
  });

  it('should return the fallback for a missing key', () => {
    expect(service.get('missing', 'fallback')).toBe('fallback');
  });

  it('should return the fallback when the stored value is not valid JSON', () => {
    localStorage.setItem('broken', '{not json');

    expect(service.get('broken', 42)).toBe(42);
  });

  it('should remove a key', () => {
    service.set('token', 'abc');
    service.remove('token');

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should remove the key when the value has no JSON form (undefined)', () => {
    service.set('token', 'abc');

    expect(service.set('token', undefined)).toBe(true);
    expect(localStorage.getItem('token')).toBeNull();
    expect(service.get('token', 'fallback')).toBe('fallback');
  });

  it('should report a failed write instead of throwing (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(service.set('big', 'value')).toBe(false);
  });

  describe('when the browser blocks storage', () => {
    beforeEach(() => {
      const blockedWindow = {
        get localStorage(): Storage {
          throw new DOMException('Access denied', 'SecurityError');
        },
      };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: DOCUMENT, useValue: { defaultView: blockedWindow } }],
      });
      service = TestBed.inject(LocalStorage);
    });

    it('should fall back to defaults and never throw', () => {
      expect(service.get('prefs', 'default')).toBe('default');
      expect(service.set('prefs', 'value')).toBe(false);
      expect(() => service.remove('prefs')).not.toThrow();
    });
  });
});
