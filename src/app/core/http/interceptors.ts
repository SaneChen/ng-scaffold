/**
 * The application's HTTP interceptors, in order (outermost first).
 *
 * How this file was built: written by hand (an array constant), registered in app.config.ts with
 * `provideHttpClient(withInterceptors(httpInterceptors))`.
 *
 * Why this order: a request passes the interceptors from top to bottom and its response passes
 * them back from bottom to top.
 *   1. `baseUrlInterceptor` first, so every later step sees the final URL.
 *   2. `settingsInterceptor` and `tokenInterceptor` add headers; the token one also sees the 401
 *      of every inner step.
 *   3. `apiInterceptor` unwraps envelopes of successful responses; `errorInterceptor`, inside it,
 *      reports HTTP failures first.
 *   4. `loggingInterceptor` closest to the network, so it times the request itself.
 *   5. `mockApiInterceptor` (only while `environment.mockApi` is true) stands in for the server:
 *      it must see the final URL and the `Authorization` header, and its answers must pass all
 *      the interceptors above like real ones.
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';
import { mockApiInterceptor } from '../mock/mock-api-interceptor';
import { apiInterceptor } from './api-interceptor';
import { baseUrlInterceptor } from './base-url-interceptor';
import { errorInterceptor } from './error-interceptor';
import { loggingInterceptor } from './logging-interceptor';
import { settingsInterceptor } from './settings-interceptor';
import { tokenInterceptor } from './token-interceptor';

export const httpInterceptors: HttpInterceptorFn[] = [
  baseUrlInterceptor,
  settingsInterceptor,
  tokenInterceptor,
  apiInterceptor,
  errorInterceptor,
  loggingInterceptor,
  ...(environment.mockApi ? [mockApiInterceptor] : []),
];
