/**
 * Unit tests for `MaterialMenu`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/menu` generated the "should create" test.
 *   2. Replaced it with tests through the opened menus: labelled triggers, link items and the
 *      nested levels down to a disabled item.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialMenu } from './menu';

describe('MaterialMenu', () => {
  let fixture: ComponentFixture<MaterialMenu>;
  let host: HTMLElement;

  function items(): HTMLElement[] {
    return Array.from(document.querySelectorAll('.mat-mdc-menu-panel [mat-menu-item]'));
  }

  async function click(element: HTMLElement | undefined): Promise<void> {
    element?.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    fixture = TestBed.createComponent(MaterialMenu);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should label the icon triggers', () => {
    const labels = Array.from(
      host.querySelectorAll('button[mat-icon-button], button[matIconButton]'),
      button => button.getAttribute('aria-label')
    );

    expect(labels).toEqual([
      'demo.material.menu.open',
      'demo.material.menu.open',
      'demo.material.menu.links.open',
    ]);
  });

  it('should list links', async () => {
    await click(
      host.querySelectorAll<HTMLElement>('mat-card')[2].querySelector('button') ?? undefined
    );

    expect(items().map(item => item.getAttribute('href'))).toEqual([
      'https://angular.dev',
      'https://material.angular.dev',
    ]);
  });

  it('should open the nested levels down to a disabled reptile', async () => {
    await click(
      host.querySelectorAll<HTMLElement>('mat-card')[3].querySelector('button') ?? undefined
    );
    await click(
      items().find(
        item => item.textContent?.includes('vertebrates') && !item.textContent.includes('in')
      )
    );
    await click(items().find(item => item.textContent?.includes('reptiles')));

    const last = items().at(-1);
    expect(last?.textContent?.trim()).toBe('demo.material.menu.animals.velociraptor');
    expect((last as HTMLButtonElement | undefined)?.disabled).toBe(true);
  });
});
