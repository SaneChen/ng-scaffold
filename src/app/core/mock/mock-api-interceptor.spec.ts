/**
 * Unit tests for `mockApiInterceptor`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/mock/mock-api` generated the "should be created" test.
 *   2. Replaced it with requests through `HttpClient` (latency 0, base URL with a path): answers
 *      and errors of the mock, `/user/menu` served from `data/menu.json`, and requests the mock
 *      does not implement reaching the network.
 */
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { TokenResponse } from '../auth/auth-token';
import { API_BASE_URL } from '../http/api-url';
import { apiPath, MOCK_API_LATENCY, mockApiInterceptor } from './mock-api-interceptor';

describe('mockApiInterceptor', () => {
  let http: HttpClient;
  let network: HttpTestingController;
  const api = 'https://api.example.com/v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: api },
        { provide: MOCK_API_LATENCY, useValue: 0 },
        provideHttpClient(withInterceptors([mockApiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    network = TestBed.inject(HttpTestingController);
  });

  afterEach(() => network.verify());

  async function signIn(): Promise<HttpHeaders> {
    const tokens = await firstValueFrom(
      http.post<TokenResponse>(`${api}/auth/login`, {
        username: 'ng-scaffold',
        password: 'ng-scaffold',
      })
    );
    return new HttpHeaders({ Authorization: `Bearer ${tokens.access_token}` });
  }

  it('should answer the API from memory', async () => {
    const headers = await signIn();

    const user = await firstValueFrom(http.get(`${api}/user`, { headers }));

    expect(user).toEqual(expect.objectContaining({ name: 'ng-scaffold' }));
    network.expectNone(() => true);
  });

  it('should fail like a server does', async () => {
    const error = await firstValueFrom(http.get(`${api}/user`)).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(401);
  });

  it('should serve the menu of a signed-in user from data/menu.json', async () => {
    const headers = await signIn();

    const menu = firstValueFrom(http.get(`${api}/user/menu`, { headers }));
    const asset = network.expectOne('data/menu.json');
    expect(asset.request.headers.has('Authorization')).toBe(false);
    asset.flush({ menu: [{ route: 'dashboard' }] });

    expect(await menu).toEqual({ menu: [{ route: 'dashboard' }] });
  });

  it('should pass requests it does not implement to the network', () => {
    http.get(`${api}/orders`).subscribe();

    network.expectOne(`${api}/orders`).flush([]);
  });
});

describe('apiPath', () => {
  it('should strip the base URL only from paths below it', () => {
    expect(apiPath('https://api.example.com/v1/user?x=1', 'https://api.example.com/v1')).toBe(
      '/user'
    );
    expect(apiPath('/api/auth/login/', '/api')).toBe('/auth/login');
    expect(apiPath('/apiary/hives', '/api')).toBe('/apiary/hives');
  });
});
