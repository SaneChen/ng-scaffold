/**
 * Behavior tests for MaterialGridList.
 * How this file was built: generated with the component, then replaced the creation test
 * with checks for the demo's actions, semantics or layout contracts.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MaterialGridList } from './grid-list';

describe('MaterialGridList', () => {
  let fixture: ComponentFixture<MaterialGridList>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    fixture = TestBed.createComponent(MaterialGridList);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should keep spans only in the fixed-height grid and load local photos', () => {
    const lists = fixture.debugElement.queryAll(By.directive(MatGridList));
    expect(lists.map(list => (list.componentInstance as MatGridList).rowHeight)).toEqual([
      '100px',
      '2:1',
      'fit',
      '200px',
    ]);
    const fixed = lists[0].queryAll(By.directive(MatGridTile));
    expect(fixed.map(tile => (tile.componentInstance as MatGridTile).colspan)).toEqual([
      2, 1, 1, 1,
    ]);
    expect(fixed.map(tile => (tile.componentInstance as MatGridTile).rowspan)).toEqual([
      1, 2, 1, 1,
    ]);
    expect(Array.from(host.querySelectorAll('img'), image => image.getAttribute('src'))).toEqual([
      'images/pixabay/21.jpg',
      'images/pixabay/22.jpg',
      'images/pixabay/23.jpg',
    ]);
    expect(host.querySelectorAll('img[alt=""]')).toHaveLength(0);
  });
});
