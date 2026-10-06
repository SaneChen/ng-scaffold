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
 *   4. `loggingInterceptor` last, closest to the network, so it times the request itself.
 */
import { HttpInterceptorFn } from '@angular/common/http';
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
];
