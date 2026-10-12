/**
 * Behavior tests for MaterialCard.
 * How this file was built: generated with the component, then replaced the creation test
 * with checks for the demo's actions, semantics or layout contracts.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialCard } from './card';

describe('MaterialCard', () => {
  let fixture: ComponentFixture<MaterialCard>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    fixture = TestBed.createComponent(MaterialCard);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should toggle the accessible like action and report the share action', async () => {
    const buttons = host.querySelectorAll<HTMLButtonElement>('mat-card-actions button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    buttons[0].click();
    await fixture.whenStable();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    buttons[0].click();
    buttons[1].click();
    await fixture.whenStable();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      'demo.material.card.shared'
    );
    expect(Array.from(host.querySelectorAll('img'), image => image.getAttribute('ngsrc'))).toEqual([
      'images/pixabay/21.jpg',
      'images/pixabay/21.jpg',
      'images/pixabay/21.jpg',
    ]);
  });
});
