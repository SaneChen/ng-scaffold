/**
 * In-memory backend behind `mockApiInterceptor`: accounts and tokens of the demo API.
 *
 * How this file was built:
 *   1. `yarn ng g service core/mock/mock-backend` generated an empty `@Service()` class and its
 *      spec.
 *   2. Added the demo account (`ng-scaffold` / `ng-scaffold`, role ADMIN) and `handle()`, which
 *      answers the endpoints of `LoginApi` with a status and a body: login, sign-up, refresh,
 *      logout and the current user.
 *   3. Tokens are unsigned JWTs (`alg: none`) whose payload holds the user id, the token kind and
 *      `exp`, so the client exercises its real JWT, expiry and refresh code paths.
 *   4. Added `PATCH /user` (name and email of the signed-in account, validated like a server
 *      would) for the profile settings page.
 *   5. Error messages are translation keys of public/i18n: a real API localizes its messages
 *      from the `Accept-Language` header; the mock lets the forms' translate pipe do it.
 *
 * Why: the scaffold runs and can be demonstrated without a server. ng-matero used
 * `angular-in-memory-web-api`, whose module its published specs imported without installing it;
 * this needs no dependency and is removed by setting `environment.mockApi` to false. It is a
 * demo, not a security model: passwords are compared in plain text and tokens are not signed.
 */
import { HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Service } from '@angular/core';
import { encodeBase64Url, decodeBase64Url, TokenResponse } from '../auth/auth-token';
import { User } from '../auth/user';

/** What `handle()` answers: an HTTP status and a JSON body. */
export interface MockResponse {
  status: number;
  body: unknown;
}

interface Account extends User {
  username: string;
  password: string;
}

type TokenKind = 'access' | 'refresh';

/** Lifetimes of the issued tokens, in seconds. */
export const MOCK_ACCESS_TOKEN_TTL = 3600;
export const MOCK_REFRESH_TOKEN_TTL = 86_400;

@Service()
export class MockBackend {
  readonly #accounts: Account[] = [
    {
      id: 1,
      username: 'ng-scaffold',
      password: 'ng-scaffold',
      name: 'ng-scaffold',
      email: 'ng-scaffold@example.com',
      roles: ['ADMIN'],
    },
  ];

  /**
   * Answers `method path` (path relative to the API root, without query), or returns `undefined`
   * for requests the mock does not implement.
   */
  handle(req: HttpRequest<unknown>, path: string, now = Date.now()): MockResponse | undefined {
    switch (`${req.method} ${path}`) {
      case 'POST /auth/login':
        return this.#login(req.body, now);
      case 'POST /auth/register':
        return this.#register(req.body, now);
      case 'POST /auth/refresh':
        return this.#refresh(req.body, now);
      case 'POST /auth/logout':
        return { status: HttpStatusCode.Ok, body: {} };
      case 'GET /user':
        return this.#withUser(req, now, account => ({
          status: HttpStatusCode.Ok,
          body: toUser(account),
        }));
      case 'PATCH /user':
        return this.#withUser(req, now, account => this.#updateUser(account, req.body));
      default:
        return undefined;
    }
  }

  /** The account a valid access token in the `Authorization` header belongs to. */
  authenticate(req: HttpRequest<unknown>, now = Date.now()): User | undefined {
    const [scheme, token] = (req.headers.get('Authorization') ?? '').split(' ');
    const account =
      scheme?.toLowerCase() === 'bearer' ? this.#verify(token ?? '', 'access', now) : undefined;
    return account && toUser(account);
  }

  #login(body: unknown, now: number): MockResponse {
    const { username, password } = fields(body, 'username', 'password');
    const account = this.#accounts.find(a => a.username === username || a.email === username);
    if (!account || account.password !== password) {
      return invalid('validation.credentials_incorrect', {
        password: ['validation.credentials_incorrect'],
      });
    }
    return { status: HttpStatusCode.Ok, body: this.#issue(account, now) };
  }

  #register(body: unknown, now: number): MockResponse {
    const { username, password, email } = fields(body, 'username', 'password', 'email');
    if (!username || !password) {
      return invalid('validation.credentials_required', {});
    }
    if (this.#accounts.some(a => a.username === username)) {
      return invalid('validation.username_taken', {
        username: ['validation.username_taken'],
      });
    }
    const account: Account = {
      id: this.#accounts.length + 1,
      username,
      password,
      name: username,
      email: email || `${username}@example.com`,
      roles: ['GUEST'],
    };
    this.#accounts.push(account);
    return { status: HttpStatusCode.Created, body: this.#issue(account, now) };
  }

  #updateUser(account: Account, body: unknown): MockResponse {
    const { name, email } = fields(body, 'name', 'email');
    const errors: Record<string, string[]> = {};
    if (!name.trim()) {
      errors['name'] = ['validation.required'];
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
      errors['email'] = ['validation.invalid_email'];
    }
    if (Object.keys(errors).length > 0) {
      return invalid('validation.invalid', errors);
    }
    account.name = name.trim();
    account.email = email;
    return { status: HttpStatusCode.Ok, body: toUser(account) };
  }

  #refresh(body: unknown, now: number): MockResponse {
    const account = this.#verify(fields(body, 'refresh_token').refresh_token, 'refresh', now);
    return account
      ? { status: HttpStatusCode.Ok, body: this.#issue(account, now) }
      : unauthorized();
  }

  #withUser(
    req: HttpRequest<unknown>,
    now: number,
    respond: (account: Account) => MockResponse
  ): MockResponse {
    const user = this.authenticate(req, now);
    const account = user && this.#accounts.find(a => a.id === user.id);
    return account ? respond(account) : unauthorized();
  }

  #issue(account: Account, now: number): TokenResponse {
    return {
      access_token: createToken(account, 'access', now, MOCK_ACCESS_TOKEN_TTL),
      token_type: 'bearer',
      expires_in: MOCK_ACCESS_TOKEN_TTL,
      refresh_token: createToken(account, 'refresh', now, MOCK_REFRESH_TOKEN_TTL),
    };
  }

  #verify(token: string, kind: TokenKind, now: number): Account | undefined {
    try {
      const claims: unknown = JSON.parse(decodeBase64Url(token.split('.')[1] ?? ''));
      const {
        sub,
        kind: tokenKind,
        exp,
      } = claims as { sub?: unknown; kind?: unknown; exp?: unknown };
      if (tokenKind !== kind || typeof exp !== 'number' || exp * 1000 <= now) {
        return undefined;
      }
      return this.#accounts.find(a => String(a.id) === sub);
    } catch {
      return undefined;
    }
  }
}

function createToken(account: Account, kind: TokenKind, now: number, ttl: number): string {
  const header = { alg: 'none', typ: 'JWT' };
  const claims = { sub: String(account.id), kind, exp: Math.floor(now / 1000) + ttl };
  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(claims))}.`;
}

/** The public part of an account (no credentials). */
function toUser({ id, name, email, avatar, roles, permissions }: Account): User {
  return { id, name, email, avatar, roles, permissions };
}

/** Reads string fields of a JSON request body; missing or non-string fields become ''. */
function fields<K extends string>(body: unknown, ...names: K[]): Record<K, string> {
  const source = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  return Object.fromEntries(
    names.map(name => [name, typeof source[name] === 'string' ? source[name] : ''])
  ) as Record<K, string>;
}

function invalid(message: string, errors: Record<string, string[]>): MockResponse {
  return { status: HttpStatusCode.UnprocessableEntity, body: { message, errors } };
}

function unauthorized(): MockResponse {
  return { status: HttpStatusCode.Unauthorized, body: { message: 'Unauthenticated.' } };
}
