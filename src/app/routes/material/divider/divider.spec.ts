/**
 * Behavior tests for MaterialDivider.
 * How this file was built: generated with the component, then replaced the creation test
 * with checks for the demo's actions, semantics or layout contracts.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialDivider } from './divider';

describe('MaterialDivider', () => {
  let fixture: ComponentFixture<MaterialDivider>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    fixture = TestBed.createComponent(MaterialDivider);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should expose separators between each pair of list items in all three examples', () => {
    const lists = host.querySelectorAll('mat-list');
    expect(lists).toHaveLength(3);
    for (const list of lists) {
      expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(3);
      expect(list.querySelectorAll('[role="separator"]')).toHaveLength(2);
    }
    expect(lists[2].querySelector('[role="separator"]')?.getAttribute('aria-orientation')).toBe(
      'vertical'
    );
    expect(lists[0].querySelector('[role="separator"]')?.getAttribute('aria-orientation')).toBe(
      'horizontal'
    );
  });
});
