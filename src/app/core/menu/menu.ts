/**
 * The navigation tree: what `GET /user/menu` returns and the side and top menus render.
 *
 * How this file was built:
 *   1. `yarn ng g interface core/menu/menu` generated an empty interface.
 *   2. Ported the shape of ng-matero's `Menu`/`MenuChildrenItem` (route, name, type, icon, label,
 *      badge, permissions, children) as one recursive `MenuItem` plus `Menu` for the top level,
 *      which always has an icon. ng-matero's `active` signal is view state and is not part of
 *      the data.
 *
 * Why: public/data/menu.json and a real backend deliver this JSON; keeping ng-matero's field
 * names lets existing menus be reused unchanged.
 */

/** `link`: router link; `sub`: expandable group; `extLink`/`extTabLink`: external URL. */
export type MenuItemType = 'link' | 'sub' | 'extLink' | 'extTabLink';

/** A small colored tag next to an item; `color` is a palette utility, e.g. `red-50`. */
export interface MenuTag {
  color: string;
  value: string;
}

/** Roles or permissions that may (`only`) or may not (`except`) see an item. */
export interface MenuPermissions {
  only?: string | string[];
  except?: string | string[];
}

export interface MenuItem {
  /** Path segment(s) of this item, joined to the parent's route; a URL for external links. */
  route: string;
  /** Name; `MenuStore` turns it into the translation key `menu.<parent>.<name>`. */
  name: string;
  type: MenuItemType;
  /** Material Symbols ligature, e.g. `dashboard`. */
  icon?: string;
  label?: MenuTag;
  badge?: MenuTag;
  permissions?: MenuPermissions;
  children?: MenuItem[];
}

/** A top-level menu entry. */
export interface Menu extends MenuItem {
  icon: string;
}
