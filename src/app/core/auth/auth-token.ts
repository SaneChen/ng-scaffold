/**
 * An access token as the client keeps it: plain (opaque) or JWT, with its expiry and refresh time.
 *
 * How this file was built:
 *   1. `yarn ng g class core/auth/auth-token` generated an empty class and its spec.
 *   2. Added `TokenResponse` (what `/auth/login` and `/auth/refresh` return, OAuth 2 field names)
 *      and `StoredToken` (what is persisted: the relative `expires_in` is turned into an absolute
 *      `exp` when the response arrives, so a token restored later still knows when it expires).
 *   3. Added JWT detection and payload decoding with the native `atob()` + `TextDecoder`
 *      (base64url, UTF-8). The relative `expires_in` wins over an absolute `exp` (of the response
 *      or the JWT claim): it is measured on the client's clock, so a client clock that is ahead of
 *      the server's cannot make a fresh token look expired.
 *   4. Added `valid()`, `refreshable`, `refreshAt` and `authorizationHeader` (they replace the
 *      `needsRefresh()` of the task spec: `refreshAt` tells both whether and when).
 *
 * Why: ng-matero split this into `BaseToken`/`SimpleToken`/`JwtToken` plus a `TokenFactory`
 * service and decoded with `base64-js`, which decoded UTF-8 payloads byte by byte (wrong for
 * non-ASCII names). One immutable class covers both kinds, needs no dependency, and every time
 * check takes `now` as a parameter so it is testable without fake timers.
 */

/** Response body of the login, sign-up and refresh endpoints. */
export interface TokenResponse {
  access_token: string;
  /** Authorization scheme; `bearer` when missing. */
  token_type?: string;
  /** Lifetime in seconds, counted from the moment the response arrives. */
  expires_in?: number;
  refresh_token?: string;
  /** Absolute expiry in seconds since the epoch, if the server sends it instead of `expires_in`. */
  exp?: number;
}

/** The persisted form of a token (see `AuthToken.toJSON()`). */
export interface StoredToken {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  /** Expiry in seconds since the epoch; missing for a token that does not expire. */
  exp?: number;
}

/** Refresh this long before the access token expires, so requests never carry a stale token. */
export const REFRESH_MARGIN_MS = 5_000;

export class AuthToken {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly refreshToken: string | undefined;
  /** Expiry in milliseconds since the epoch; `undefined` when the token does not expire. */
  readonly expiresAt: number | undefined;
  /** Claims of a JWT access token; `undefined` for an opaque token. */
  readonly claims: Readonly<Record<string, unknown>> | undefined;

  constructor(stored: StoredToken) {
    this.accessToken = stored.access_token;
    this.tokenType = stored.token_type || 'bearer';
    this.refreshToken = stored.refresh_token || undefined;
    this.claims = decodeJwtClaims(stored.access_token);
    const claim = this.claims?.['exp'];
    const exp = stored.exp ?? (typeof claim === 'number' ? claim : undefined);
    this.expiresAt = typeof exp === 'number' ? exp * 1000 : undefined;
  }

  /** Builds a token from a login or refresh response received at `now` (ms since the epoch). */
  static fromResponse(response: TokenResponse, now = Date.now()): AuthToken {
    const exp =
      response.expires_in === undefined
        ? response.exp
        : Math.floor(now / 1000) + response.expires_in;
    return new AuthToken({
      access_token: response.access_token,
      token_type: response.token_type || 'bearer',
      refresh_token: response.refresh_token,
      exp,
    });
  }

  /** Whether this is a JWT (its payload was decoded). */
  get isJwt(): boolean {
    return this.claims !== undefined;
  }

  /** Whether a refresh token is available and the access token expires, i.e. can be renewed. */
  get refreshable(): boolean {
    return this.refreshToken !== undefined && this.expiresAt !== undefined;
  }

  /** When to renew a refreshable token (ms since the epoch); `undefined` when it cannot be. */
  get refreshAt(): number | undefined {
    return this.refreshable ? (this.expiresAt as number) - REFRESH_MARGIN_MS : undefined;
  }

  /** `Authorization` header value, e.g. `Bearer eyJhbGciOi…`. */
  get authorizationHeader(): string {
    const scheme = this.tokenType.charAt(0).toUpperCase() + this.tokenType.slice(1).toLowerCase();
    return `${scheme} ${this.accessToken}`;
  }

  /** Whether the access token is present and not expired at `now`. */
  valid(now = Date.now()): boolean {
    return this.accessToken !== '' && (this.expiresAt === undefined || this.expiresAt > now);
  }

  /** The persisted form; `JSON.stringify(token)` uses it. */
  toJSON(): StoredToken {
    return {
      access_token: this.accessToken,
      token_type: this.tokenType,
      ...(this.refreshToken === undefined ? {} : { refresh_token: this.refreshToken }),
      ...(this.expiresAt === undefined ? {} : { exp: this.expiresAt / 1000 }),
    };
  }
}

/** Encodes UTF-8 text as unpadded base64url (the JWT alphabet). */
export function encodeBase64Url(text: string): string {
  const binary = Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte));
  return btoa(binary.join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decodes base64url (padded or not) to UTF-8 text; throws on invalid input. */
export function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

/**
 * The claims of a JWT (`header.payload.signature`, header with an `alg`), or `undefined` when
 * the token is not a JWT. The signature is not verified: only the server can trust a token.
 */
function decodeJwtClaims(token: string): Record<string, unknown> | undefined {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return undefined;
  }
  try {
    const header: unknown = JSON.parse(decodeBase64Url(parts[0]));
    const claims: unknown = JSON.parse(decodeBase64Url(parts[1]));
    if (isObject(header) && typeof header['alg'] === 'string' && isObject(claims)) {
      return claims;
    }
  } catch {
    // Not base64url or not JSON: an opaque token that happens to contain two dots.
  }
  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
