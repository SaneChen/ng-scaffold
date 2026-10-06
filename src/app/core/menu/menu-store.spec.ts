/**
 * Unit tests for `MenuStore`, plus a consistency check of the shipped menu.
 *
 * How this file was built:
 *   1. `yarn ng g service core/menu/menu-store` generated the "should be created" test.
 *   2. Replaced it with tests for the translation namespace (without mutating the input), the
 *      trail of nested items, groups whose route is `/`, ignored query strings and external
 *      links, and `reset()`.
 *   3. Added a check that every item of public/data/menu.json has a valid type, a Material Symbols
 *      icon at the top level and a translation in each shipped language.
 */
import { TestBed } from '@angular/core/testing';
import enUS from '../../../../public/i18n/en-US.json';
import zhCN from '../../../../public/i18n/zh-CN.json';
import zhTW from '../../../../public/i18n/zh-TW.json';
import shipped from '../../../../public/data/menu.json';
import { Menu, MenuItem } from './menu';
import { buildRoute, MenuStore } from './menu-store';

const MENU: Menu[] = [
  { route: 'dashboard', name: 'dashboard', type: 'link', icon: 'dashboard' },
  {
    route: 'material',
    name: 'material',
    type: 'sub',
    icon: 'favorite',
    children: [
      {
        route: 'buttons',
        name: 'buttons',
        type: 'sub',
        children: [{ route: 'button', name: 'button', type: 'link' }],
      },
    ],
  },
  { route: 'https://example.com', name: 'docs', type: 'extTabLink', icon: 'extension' },
  {
    route: '/',
    name: 'sessions',
    type: 'sub',
    icon: 'question_answer',
    children: [{ route: '403', name: '403', type: 'link' }],
  },
];

describe('MenuStore', () => {
  let store: MenuStore;

  beforeEach(() => {
    store = TestBed.inject(MenuStore);
    store.set(MENU);
  });

  it('should turn names into translation keys without changing the input', () => {
    const material = store.menu()[1];

    expect(material.name).toBe('menu.material');
    expect(material.children?.[0].children?.[0].name).toBe('menu.material.buttons.button');
    expect(MENU[1].name).toBe('material');
  });

  it('should find the trail of a nested item and ignore the query string', () => {
    const names = store.trail('/material/buttons/button?tab=2#top').map(item => item.name);

    expect(names).toEqual([
      'menu.material',
      'menu.material.buttons',
      'menu.material.buttons.button',
    ]);
  });

  it('should match children of a group whose route is the root', () => {
    expect(store.trail('/403').map(item => item.name)).toEqual([
      'menu.sessions',
      'menu.sessions.403',
    ]);
  });

  it('should return an empty trail for unknown paths and external links', () => {
    expect(store.trail('/material/unknown')).toEqual([]);
    expect(store.trail('/https:/example.com')).toEqual([]);
    expect(store.trail('/')).toEqual([]);
  });

  it('should empty the menu on reset()', () => {
    store.reset();

    expect(store.menu()).toEqual([]);
    expect(store.trail('/dashboard')).toEqual([]);
  });

  it('should join routes into an absolute path', () => {
    expect(buildRoute('/', 'material/', '/buttons', 'button')).toBe('/material/buttons/button');
  });
});

describe('public/data/menu.json', () => {
  const languages: Record<string, { menu: Record<string, string> }> = {
    'en-US': enUS,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
  };

  function keys(items: MenuItem[], parent = ''): string[] {
    return items.flatMap(item => {
      const key = parent ? `${parent}.${item.name}` : item.name;
      return [key, ...keys(item.children ?? [], key)];
    });
  }

  it('should describe valid items with an icon at the top level', () => {
    const menu = shipped.menu as Menu[];
    const all = (items: MenuItem[]): MenuItem[] =>
      items.flatMap(item => [item, ...all(item.children ?? [])]);

    expect(menu.every(item => typeof item.icon === 'string' && item.icon !== '')).toBe(true);
    expect(
      all(menu).filter(item => !['link', 'sub', 'extLink', 'extTabLink'].includes(item.type))
    ).toEqual([]);
  });

  it('should have a translation of every item in every language', () => {
    for (const [code, translations] of Object.entries(languages)) {
      const missing = keys(shipped.menu as MenuItem[]).filter(key => !translations.menu[key]);
      expect(missing, code).toEqual([]);
    }
  });
});
