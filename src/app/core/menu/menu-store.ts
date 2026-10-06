/**
 * Holds the navigation menu of the signed-in user and answers "where am I in it?".
 *
 * How this file was built:
 *   1. `yarn ng g service core/menu/menu-store` generated an empty `@Service()` class and its
 *      spec.
 *   2. Added the private `#menu` signal with the read-only `menu` view and `set()` / `reset()`.
 *      `set()` copies the tree and prefixes every name with its translation namespace
 *      (`material` → `menu.material`, its child `button` → `menu.material.button`), as
 *      ng-matero's `addNamespace()` did, without mutating the input.
 *   3. Added `trail(url)`: the items from the top level down to the item whose joined routes
 *      match the URL path, for breadcrumbs and for expanding the active group of the side menu.
 *   4. Added `visibleMenu` (with the permissions): the items whose `permissions` rule the user
 *      passes; a group whose children are all hidden is hidden too.
 *   5. With the start-up step, the menu became a `linkedSignal` of an `rxResource` keyed on
 *      `TokenStore.session`: it loads `GET /user/menu` for every sign-in (also another user's
 *      over an active session) and empties on sign-out; `set()` still
 *      overrides it. `loading` tells `Startup` when the first load has settled.
 *
 * Why: ng-matero kept the menu in a `BehaviorSubject` and found the trail with a JSON-cloning
 * breadth-first search over route arrays. A signal lets breadcrumbs and menus derive their state
 * with `computed()`; the depth-first `trail()` is a pure function of the tree and the URL.
 */
import { computed, inject, linkedSignal, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LoginApi } from '../auth/login-api';
import { TokenStore } from '../auth/token-store';
import { PermissionStore } from '../permissions/permission-store';
import { Menu, MenuItem } from './menu';

/** Translation namespace of menu names (public/i18n/*.json → `menu`). */
export const MENU_NAMESPACE = 'menu';

@Service()
export class MenuStore {
  readonly #tokens = inject(TokenStore);
  readonly #api = inject(LoginApi);

  readonly #loaded = rxResource<Menu[], number | undefined>({
    params: () => this.#tokens.session(),
    stream: () => this.#api.menu(),
  });

  readonly #menu = linkedSignal<Menu[]>(() =>
    this.#loaded.hasValue() ? (withNamespace(this.#loaded.value(), MENU_NAMESPACE) as Menu[]) : []
  );

  readonly #permissions = inject(PermissionStore);

  /** Whether `GET /user/menu` is in flight. */
  readonly loading = this.#loaded.isLoading;

  /** The full menu, names already translation keys. */
  readonly menu = this.#menu.asReadonly();

  /** The menu the user may see: what the side and top menus render. */
  readonly visibleMenu = computed(
    () => visibleItems(this.#menu(), item => this.#permissions.has(item.permissions)) as Menu[]
  );

  /** Replaces the menu (as delivered by the API). */
  set(menu: Menu[]): void {
    this.#menu.set(withNamespace(menu, MENU_NAMESPACE) as Menu[]);
  }

  /** Empties the menu (sign-out). */
  reset(): void {
    this.#menu.set([]);
  }

  /**
   * The chain of items whose joined routes equal the path of `url` (query and fragment ignored),
   * from the top level down; empty when no item matches. External links never match.
   */
  trail(url: string, menu: readonly MenuItem[] = this.#menu()): MenuItem[] {
    return findTrail(menu, segments(url), []) ?? [];
  }
}

/** Joins route parts into an absolute router path: `['material', 'button']` → `/material/button`. */
export function buildRoute(...routes: string[]): string {
  return '/' + routes.flatMap(segments).join('/');
}

function visibleItems(
  items: readonly MenuItem[],
  allowed: (item: MenuItem) => boolean
): MenuItem[] {
  return items.flatMap(item => {
    if (!allowed(item)) {
      return [];
    }
    if (item.type !== 'sub' || !item.children) {
      return [item];
    }
    const children = visibleItems(item.children, allowed);
    return children.length > 0 ? [{ ...item, children }] : [];
  });
}

function withNamespace(items: readonly MenuItem[], namespace: string): MenuItem[] {
  return items.map(item => {
    const name = `${namespace}.${item.name}`;
    return item.children
      ? { ...item, name, children: withNamespace(item.children, name) }
      : { ...item, name };
  });
}

function findTrail(
  items: readonly MenuItem[],
  path: readonly string[],
  parent: readonly string[]
): MenuItem[] | undefined {
  for (const item of items) {
    if (item.type === 'extLink' || item.type === 'extTabLink') {
      continue;
    }
    const route = segments(item.route);
    const own = [...parent, ...route];
    if (!own.every((segment, i) => segment === path[i])) {
      continue;
    }
    // A group routed at `/` (sessions) only groups its children; it is not the page at `/`.
    if (own.length === path.length && route.length > 0) {
      return [item];
    }
    const rest = item.children && findTrail(item.children, path, own);
    if (rest) {
      return [item, ...rest];
    }
  }
  return undefined;
}

function segments(route: string): string[] {
  return route
    .split(/[?#]/)[0]
    .split('/')
    .filter(segment => segment !== '');
}
