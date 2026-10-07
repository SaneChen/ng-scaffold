/**
 * The navigation tree: what `GET /user/menu` returns and the side and top menus render.
 *
 * How this file was built:
 *   1. `yarn ng g interface core/menu/menu` generated an empty interface.
 *   2. Ported the shape of ng-matero's `Menu`/`MenuChildrenItem` (route, name, type, icon, label,
 *      badge, permissions, children) as one recursive `MenuItem` plus `Menu` for the top level,
 *      which always has an icon. ng-matero's `active` signal is view state and is not part of
 *      the data.
 *   3. Added `menuTagClass()` (with the side menu): tag background plus a readable text color.
 *   4. Documented that tag values go through the translate pipe; added `isMenuCount()`: the
 *      menus add a visually hidden "new" after a numeric badge ("Dashboard 5 new").
 *
 * Why: public/data/menu.json and a real backend deliver this JSON; keeping ng-matero's field
 * names lets existing menus be reused unchanged.
 */

/** `link`: router link; `sub`: expandable group; `extLink`/`extTabLink`: external URL. */
export type MenuItemType = 'link' | 'sub' | 'extLink' | 'extTabLink';

/**
 * A small colored tag next to an item; `color` is a palette utility, e.g. `red-40`. `value` is
 * shown through the translate pipe, so it can be a translation key (`sidebar.new`) or plain text.
 * A numeric `badge` counts new items: screen readers hear "5 new" (`sidebar.badge_new`).
 */
export interface MenuTag {
  color: string;
  value: string;
}

/**
 * Classes of a tag: its background (`bg-red-40`) and a text color that keeps the WCAG AA contrast
 * of 4.5:1 for its small text - white on the dark tones (below 50), black on the lighter ones.
 * (White text is under 4.5:1 on tone 50 of the red and azure palettes.)
 */
export function menuTagClass({ color }: MenuTag): string {
  const tone = Number(/-(\d+)$/.exec(color)?.[1] ?? 0);
  return `bg-${color} ${tone < 50 ? 'text-white' : 'text-black'}`;
}

/** Whether a tag holds a count (digits only), e.g. the `5` of a badge. */
export function isMenuCount({ value }: MenuTag): boolean {
  return /^\d+$/.test(value);
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
