/**
 * HTTP endpoints of the authentication backend (login, sign-up, refresh, logout, current user).
 *
 * How this file was built:
 *   1. `yarn ng g service core/auth/login-api` generated an empty `@Service()` class and its spec.
 *   2. Added one method per endpoint of ng-matero's `LoginService`, plus `register()`, each
 *      returning the typed `HttpClient` observable.
 *   3. Login, sign-up and logout opt out of `errorInterceptor` (`HANDLE_HTTP_ERRORS`): the forms
 *      show their own errors, and logout is best effort. The refresh request is marked with
 *      `IS_TOKEN_REFRESH`, so `tokenInterceptor` does not hold it back waiting for itself.
 *
 * Why: the URLs and payloads of the backend live in one class, so connecting a real API means
 * changing this file (or replacing the service) only. Paths are relative to the API base URL
 * (`environment.baseUrl`, prefixed by `baseUrlInterceptor`); the mock API answers them while
 * `environment.mockApi` is true.
 */
import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { HANDLE_HTTP_ERRORS, IS_TOKEN_REFRESH } from '../http/api-url';
import { TokenResponse } from './auth-token';
import { User } from './user';

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationData {
  username: string;
  password: string;
  email?: string;
}

/** Context of requests whose errors the caller presents itself. */
const SELF_HANDLED = () => new HttpContext().set(HANDLE_HTTP_ERRORS, false);

@Service()
export class LoginApi {
  readonly #http = inject(HttpClient);

  login(credentials: LoginCredentials): Observable<TokenResponse> {
    return this.#http.post<TokenResponse>('/auth/login', credentials, { context: SELF_HANDLED() });
  }

  register(data: RegistrationData): Observable<TokenResponse> {
    return this.#http.post<TokenResponse>('/auth/register', data, { context: SELF_HANDLED() });
  }

  refresh(refreshToken: string): Observable<TokenResponse> {
    return this.#http.post<TokenResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken },
      { context: new HttpContext().set(IS_TOKEN_REFRESH, true) }
    );
  }

  logout(): Observable<unknown> {
    return this.#http.post('/auth/logout', {}, { context: SELF_HANDLED() });
  }

  user(): Observable<User> {
    return this.#http.get<User>('/user');
  }
}
