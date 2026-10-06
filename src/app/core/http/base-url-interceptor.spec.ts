/**
 * Unit tests for `baseUrlInterceptor` and the `api-url` rules it applies.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/base-url` generated the "should be created" test.
 *   2. Replaced it with requests through `HttpClient` + `HttpTestingController`: relative API
 *      paths get the base URL, static assets and absolute URLs do not, an empty base URL changes
 *      nothing, a relative base URL is not added twice; plus direct tests of `isApiUrl()` for
 *      look-alike hosts and letter case.
 */
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, isApiUrl } from './api-url';
import { baseUrlInterceptor } from './base-url-interceptor';

describe('baseUrlInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  function setup(baseUrl: string) {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: baseUrl },
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  function requestedUrl(url: string): string {
    http.get(url).subscribe();
    const req = backend.match(() => true)[0];
    req.flush({});
    return req.request.url;
  }

  afterEach(() => backend.verify());

  it('should prefix relative API paths with the base URL', () => {
    setup('https://api.example.com/v1/');

    expect(requestedUrl('/user')).toBe('https://api.example.com/v1/user');
    expect(requestedUrl('./auth/login')).toBe('https://api.example.com/v1/auth/login');
  });

  it('should leave static assets and absolute URLs alone', () => {
    setup('https://api.example.com');

    expect(requestedUrl('i18n/en-US.json')).toBe('i18n/en-US.json');
    expect(requestedUrl('./data/menu.json')).toBe('./data/menu.json');
    expect(requestedUrl('https://cdn.example.org/x.json')).toBe('https://cdn.example.org/x.json');
    expect(requestedUrl('/images/logo.svg')).toBe('/images/logo.svg');
  });

  it('should not prefix a path twice with a relative base URL', () => {
    setup('/api');

    expect(requestedUrl('/api/user')).toBe('/api/user');
    expect(requestedUrl('/apiary/hives')).toBe('/api/apiary/hives');
  });

  it('should change nothing without a base URL', () => {
    setup('');

    expect(requestedUrl('/user')).toBe('/user');
  });
});

describe('isApiUrl', () => {
  it('should accept the base URL host and reject look-alike hosts', () => {
    const base = 'https://api.example.com';

    expect(isApiUrl('https://api.example.com/user', base)).toBe(true);
    expect(isApiUrl('https://api.example.com', base)).toBe(true);
    expect(isApiUrl('https://api.example.com.evil.org/user', base)).toBe(false);
    expect(isApiUrl('https://other.org/user', base)).toBe(false);
    expect(isApiUrl('//api.example.com/user', '')).toBe(false);
    expect(isApiUrl('HTTPS://API.example.com/user', base)).toBe(true);
  });

  it('should treat relative non-asset paths as API calls', () => {
    expect(isApiUrl('/user', '')).toBe(true);
    expect(isApiUrl('images/a.png', '')).toBe(false);
  });
});
