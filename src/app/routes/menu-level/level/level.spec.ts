/**
 * Unit tests for `MenuLevelPage`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/menu-level/level --inline-template --inline-style` generated
 *      the "should create" test.
 *   2. Replaced it with a test through the real menu-level routes and a nested menu: the deepest
 *      leaf shows its depth and the names on its way.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Menu, MenuStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import routes from '../menu-level.routes';

const MENU: Menu[] = [
  {
    route: 'menu-level',
    name: 'menu-level',
    type: 'sub',
    icon: 'subject',
    children: [
      {
        route: 'level-1-1',
        name: 'level-1-1',
        type: 'sub',
        children: [
          {
            route: 'level-2-1',
            name: 'level-2-1',
            type: 'sub',
            children: [
              {
                route: 'level-3-1',
                name: 'level-3-1',
                type: 'sub',
                children: [{ route: 'level-4-1', name: 'level-4-1', type: 'link' }],
              },
            ],
          },
        ],
      },
    ],
  },
];

describe('MenuLevelPage', () => {
  it('should show how deep the page is and the way there', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        // The page and its routes, without the demo translations of the parent route.
        provideRouter([{ path: 'menu-level', children: routes[0].children }]),
      ],
    });
    TestBed.inject(MenuStore).set(MENU);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/menu-level/level-1-1/level-2-1/level-3-1/level-4-1');
    const page = harness.routeNativeElement as HTMLElement;

    expect(page.querySelector('mat-card p')?.textContent).toBe('demo.menu_level.depth');
    expect(Array.from(page.querySelectorAll('mat-card li'), li => li.textContent)).toEqual([
      'menu.menu-level',
      'menu.menu-level.level-1-1',
      'menu.menu-level.level-1-1.level-2-1',
      'menu.menu-level.level-1-1.level-2-1.level-3-1',
      'menu.menu-level.level-1-1.level-2-1.level-3-1.level-4-1',
    ]);
  });
});
