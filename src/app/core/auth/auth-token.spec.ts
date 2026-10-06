/**
 * Unit tests for `AuthToken` and the base64url helpers.
 *
 * How this file was built:
 *   1. `yarn ng g class core/auth/auth-token` generated the "should create an instance" test.
 *   2. Replaced it with tests for opaque and JWT tokens: expiry from `expires_in`, `exp` or the
 *      JWT claim, validity at a given time, refresh timing, the Authorization header, the
 *      persisted form and UTF-8 payloads. Times are passed explicitly, no fake timers.
 */
import {
  AuthToken,
  decodeBase64Url,
  encodeBase64Url,
  REFRESH_MARGIN_MS,
  StoredToken,
} from './auth-token';

const NOW = Date.UTC(2026, 0, 1);
const NOW_S = NOW / 1000;

function jwt(claims: Record<string, unknown>, header: Record<string, unknown> = { alg: 'none' }) {
  return [JSON.stringify(header), JSON.stringify(claims)].map(encodeBase64Url).join('.') + '.';
}

describe('AuthToken', () => {
  it('should turn expires_in into an absolute expiry when the response arrives', () => {
    const token = AuthToken.fromResponse(
      { access_token: 'abc', expires_in: 3600, refresh_token: 'r1' },
      NOW
    );

    expect(token.expiresAt).toBe(NOW + 3_600_000);
    expect(token.toJSON()).toEqual<StoredToken>({
      access_token: 'abc',
      token_type: 'bearer',
      refresh_token: 'r1',
      exp: NOW_S + 3600,
    });
  });

  it('should be valid until it expires', () => {
    const token = AuthToken.fromResponse({ access_token: 'abc', expires_in: 60 }, NOW);

    expect(token.valid(NOW + 59_999)).toBe(true);
    expect(token.valid(NOW + 60_000)).toBe(false);
  });

  it('should never expire without expires_in or exp, and never be valid without a token', () => {
    expect(AuthToken.fromResponse({ access_token: 'abc' }, NOW).valid(NOW + 1e12)).toBe(true);
    expect(AuthToken.fromResponse({ access_token: '' }, NOW).valid(NOW)).toBe(false);
  });

  it('should take the expiry of a JWT from its exp claim when expires_in is missing', () => {
    const accessToken = jwt({ sub: '1', exp: NOW_S + 120 });

    const token = AuthToken.fromResponse({ access_token: accessToken }, NOW);

    expect(token.isJwt).toBe(true);
    expect(token.claims).toEqual({ sub: '1', exp: NOW_S + 120 });
    expect(token.expiresAt).toBe(NOW + 120_000);
  });

  it('should prefer expires_in, measured on the client clock, over an absolute expiry', () => {
    // The server's clock is an hour behind: its `exp` claims are already past on the client.
    const accessToken = jwt({ exp: NOW_S - 3000 });

    const token = AuthToken.fromResponse(
      { access_token: accessToken, expires_in: 600, exp: NOW_S - 3000 },
      NOW
    );

    expect(token.expiresAt).toBe(NOW + 600_000);
    expect(token.valid(NOW)).toBe(true);
  });

  it('should treat a dotted string that is not a JWT as an opaque token', () => {
    const token = new AuthToken({ access_token: 'a.b.c', token_type: 'bearer', exp: NOW_S });

    expect(token.isJwt).toBe(false);
    expect(token.expiresAt).toBe(NOW);
  });

  it('should be refreshable only with a refresh token and an expiry', () => {
    const refreshable = AuthToken.fromResponse(
      { access_token: 'a', expires_in: 60, refresh_token: 'r' },
      NOW
    );

    expect(refreshable.refreshable).toBe(true);
    expect(refreshable.refreshAt).toBe(NOW + 60_000 - REFRESH_MARGIN_MS);
    expect(AuthToken.fromResponse({ access_token: 'a', expires_in: 60 }, NOW).refreshable).toBe(
      false
    );
    expect(AuthToken.fromResponse({ access_token: 'a', refresh_token: 'r' }, NOW).refreshAt).toBe(
      undefined
    );
  });

  it('should build the Authorization header with a capitalized scheme', () => {
    expect(AuthToken.fromResponse({ access_token: 'abc' }).authorizationHeader).toBe('Bearer abc');
    expect(
      AuthToken.fromResponse({ access_token: 'abc', token_type: 'MAC' }).authorizationHeader
    ).toBe('Mac abc');
  });

  it('should survive a JSON round trip', () => {
    const token = AuthToken.fromResponse({ access_token: jwt({ exp: NOW_S + 5 }) }, NOW);

    const restored = new AuthToken(JSON.parse(JSON.stringify(token)) as StoredToken);

    expect(restored.expiresAt).toBe(token.expiresAt);
    expect(restored.accessToken).toBe(token.accessToken);
  });
});

describe('base64url', () => {
  it('should encode and decode UTF-8 without padding', () => {
    const encoded = encodeBase64Url('{"name":"张三 ✓"}');

    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeBase64Url(encoded)).toBe('{"name":"张三 ✓"}');
  });

  it('should throw on input that is not base64url', () => {
    expect(() => decodeBase64Url('***')).toThrow();
  });
});
