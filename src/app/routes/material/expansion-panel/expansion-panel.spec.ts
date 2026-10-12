/**
 * Behavior tests for MaterialExpansionPanel.
 * How this file was built: generated with the component, then replaced the creation test
 * with checks for the demo's actions, semantics or layout contracts.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialExpansionPanel } from './expansion-panel';

describe('MaterialExpansionPanel', () => {
  let fixture: ComponentFixture<MaterialExpansionPanel>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    fixture = TestBed.createComponent(MaterialExpansionPanel);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should close the single panel through its action', async () => {
    const header = host.querySelector<HTMLElement>('mat-expansion-panel-header')!;
    header.click();
    await fixture.whenStable();
    expect(header.getAttribute('aria-expanded')).toBe('true');
    host.querySelector<HTMLButtonElement>('mat-action-row button')!.click();
    await fixture.whenStable();
    expect(header.getAttribute('aria-expanded')).toBe('false');
  });

  it('should keep the disabled panel closed and collapse the previous accordion panel', async () => {
    const headers = host.querySelectorAll<HTMLElement>('mat-accordion mat-expansion-panel-header');
    headers[0].click();
    await fixture.whenStable();
    headers[1].click();
    await fixture.whenStable();
    expect(headers[1].getAttribute('aria-disabled')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('false');
    headers[2].click();
    await fixture.whenStable();
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
    expect(headers[2].getAttribute('aria-expanded')).toBe('true');
  });
});
