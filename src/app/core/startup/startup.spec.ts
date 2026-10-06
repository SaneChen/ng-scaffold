/**
 * Unit tests for `Startup` and the session data it waits for.
 *
 * How this file was built:
 *   1. `yarn ng g service core/startup/startup` generated the "should be created" test.
 *   2. Replaced it with scenarios against `HttpTestingController`: signed out (ready at once), a
 *      restored session (ready only after `/user` and `/user/menu`; roles, permissions and menu
 *      derived from them), a failed load (still ready), and sign-out / sign-in after start-up.
 *   3. Added (review): a second sign-in over an active session reloads the menu, `ready()` gives
 *      up after `STARTUP_TIMEOUT_MS`, and `permissionGuard` waits for the new user's roles.
 */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthStore } from '../auth/auth-store';
import { TOKEN_STORAGE_KEY, TokenStore } from '../auth/token-store';
import { User } from '../auth/user';
import { Menu } from '../menu/menu';
import { MenuStore } from '../menu/menu-store';
import { PermissionStore } from '../permissions/permission-store';
import { permissionGuard } from '../permissions/permission-guard';
import { Startup, STARTUP_TIMEOUT_MS } from './startup';

const USER: User = {
  id: 1,
  name: 'Ada',
  email: 'ada@example.com',
  roles: ['ADMIN', 'AUDITOR'],
  permissions: ['export'],
};
const MENU: Menu[] = [{ route: 'dashboard', name: 'dashboard', type: 'link', icon: 'dashboard' }];

describe('Startup', () => {
  let http: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'auth/login', children: [] },
          { path: '403', children: [] },
          {
            path: 'admin',
            canActivate: [permissionGuard],
            data: { permissions: { only: 'ADMIN' } },
            children: [],
          },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(Startup);
  }

  /** Lets HTTP results reach the resources (microtasks), runs effects, then checks the promise. */
  async function isSettled(promise: Promise<void>): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve));
    TestBed.tick();
    return Promise.race([
      promise.then(() => true),
      new Promise<boolean>(resolve => setTimeout(resolve, 0, false)),
    ]);
  }

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('should be ready at once while signed out', async () => {
    const startup = setup();

    await expect(isSettled(startup.ready())).resolves.toBe(true);
    expect(TestBed.inject(MenuStore).menu()).toEqual([]);
    expect(TestBed.inject(PermissionStore).roles()).toEqual([]);
  });

  it('should wait for the user and the menu of a restored session', async () => {
    sessionStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ access_token: 'abc', token_type: 'bearer' })
    );
    const startup = setup();
    const ready = startup.ready();
    TestBed.tick();

    http.expectOne('/user').flush(USER);
    expect(await isSettled(ready)).toBe(false);
    http.expectOne('/user/menu').flush({ menu: MENU });
    expect(await isSettled(ready)).toBe(true);

    const permissions = TestBed.inject(PermissionStore);
    expect(permissions.roles()).toEqual(['ADMIN', 'AUDITOR']);
    expect(permissions.permissions()).toEqual([
      'export',
      'canAdd',
      'canDelete',
      'canEdit',
      'canRead',
    ]);
    expect(TestBed.inject(MenuStore).menu()[0].name).toBe('menu.dashboard');
  });

  it('should be ready even when the loads fail', async () => {
    sessionStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ access_token: 'abc', token_type: 'bearer' })
    );
    const ready = setup().ready();
    TestBed.tick();

    http.expectOne('/user').flush(null, { status: 500, statusText: 'Error' });
    http.expectOne('/user/menu').flush(null, { status: 500, statusText: 'Error' });

    expect(await isSettled(ready)).toBe(true);
  });

  it('should clear the session data on sign-out and load it again on sign-in', async () => {
    const startup = setup();
    const tokens = TestBed.inject(TokenStore);
    const permissions = TestBed.inject(PermissionStore);
    const menu = TestBed.inject(MenuStore);

    const login = TestBed.inject(AuthStore).login('ada', 'secret');
    http.expectOne('/auth/login').flush({ access_token: 'abc' });
    await login;
    expect(startup.settled()).toBe(false);
    TestBed.tick();
    http.expectOne('/user').flush(USER);
    http.expectOne('/user/menu').flush({ menu: MENU });
    await startup.ready();
    expect(permissions.has({ only: 'canDelete' })).toBe(true);

    tokens.clear();

    expect(permissions.roles()).toEqual([]);
    expect(menu.menu()).toEqual([]);
  });

  it('should load the menu again when another user signs in over an active session', async () => {
    setup();
    const auth = TestBed.inject(AuthStore);
    const menu = TestBed.inject(MenuStore);
    const login = auth.login('ada', 'secret');
    http.expectOne('/auth/login').flush({ access_token: 'ada' });
    await login;
    TestBed.tick();
    http.expectOne('/user').flush(USER);
    http.expectOne('/user/menu').flush({ menu: MENU });

    const register = auth.register({ username: 'eve', password: 'pw' });
    http.expectOne('/auth/register').flush({ access_token: 'eve' });
    await register;
    TestBed.tick();
    http.expectOne('/user').flush({ ...USER, roles: ['GUEST'] });
    http.expectOne('/user/menu').flush({ menu: [] });
    await vi.waitFor(() => expect(menu.menu()).toEqual([]));

    expect(TestBed.inject(PermissionStore).roles()).toEqual(['GUEST']);
  });

  it('should stop waiting after STARTUP_TIMEOUT_MS when the API never answers', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    sessionStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ access_token: 'abc', token_type: 'bearer' })
    );
    const startup = setup();
    let ready = false;
    void startup.ready().then(() => (ready = true));
    TestBed.tick();

    await vi.advanceTimersByTimeAsync(STARTUP_TIMEOUT_MS - 1);
    expect(ready).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(ready).toBe(true);

    http.match(() => true);
    vi.useRealTimers();
  });

  it('should let permissionGuard check the roles of the user who just signed in', async () => {
    setup();
    const harness = await RouterTestingHarness.create();
    const login = TestBed.inject(AuthStore).login('ada', 'secret');
    http.expectOne('/auth/login').flush({ access_token: 'abc' });
    await login;

    const navigation = harness.navigateByUrl('/admin');
    TestBed.tick();
    // Let the router reach the guard before the user's roles arrive.
    await new Promise(resolve => setTimeout(resolve, 10));
    http.expectOne('/user').flush(USER);
    http.expectOne('/user/menu').flush({ menu: MENU });
    await navigation;

    expect(TestBed.inject(Router).url).toBe('/admin');
  });
});
