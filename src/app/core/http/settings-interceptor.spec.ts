/**
 * Unit tests for `settingsInterceptor`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/settings` generated the "should be created" test.
 *   2. Replaced it with requests through `HttpClient`: the resolved language of the `language`
 *      setting is sent to the API, static assets get no header.
 */
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideAppSettings } from '../settings/app-settings';
import { settingsInterceptor } from './settings-interceptor';

describe('settingsInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideAppSettings({ language: 'zh-TW' }),
        provideTranslateService(),
        provideHttpClient(withInterceptors([settingsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('should send the current language to the API', () => {
    http.get('/user').subscribe();

    expect(backend.expectOne('/user').request.headers.get('Accept-Language')).toBe('zh-TW');
  });

  it('should not touch requests for static assets', () => {
    http.get('i18n/zh-TW.json').subscribe();

    expect(backend.expectOne('i18n/zh-TW.json').request.headers.has('Accept-Language')).toBe(false);
  });
});
