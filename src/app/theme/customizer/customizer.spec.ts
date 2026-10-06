/**
 * Unit tests for `Customizer`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/customizer` generated the "should create" test.
 *   2. Replaced it with tests that open the real panel (MatDialog in the test document): the
 *      labelled dialog, settings applied on every change, and the combinations that stay disabled.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsStore } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { Customizer, CUSTOMIZER_TITLE_ID } from './customizer';

describe('Customizer', () => {
  let fixture: ComponentFixture<Customizer>;
  let settings: SettingsStore;

  async function openPanel(): Promise<HTMLElement> {
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    return document.querySelector<HTMLElement>('[role="dialog"]') as HTMLElement;
  }

  function radio(panel: HTMLElement, value: string): HTMLInputElement {
    return panel.querySelector(`input[type="radio"][value="${value}"]`) as HTMLInputElement;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    settings = TestBed.inject(SettingsStore);
    fixture = TestBed.createComponent(Customizer);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should open a dialog labelled by the panel title', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('customizer.open');

    const panel = await openPanel();

    expect(panel.getAttribute('aria-labelledby')).toBe(CUSTOMIZER_TITLE_ID);
    expect(panel.querySelector(`#${CUSTOMIZER_TITLE_ID}`)?.textContent).toBe('customizer.title');
  });

  it('should apply every change to the settings at once', async () => {
    const panel = await openPanel();

    radio(panel, 'dark').click();
    radio(panel, 'rtl').click();
    radio(panel, 'top').click();

    expect(settings.options()).toMatchObject({ theme: 'dark', dir: 'rtl', navPos: 'top' });
  });

  it('should keep impossible combinations disabled', async () => {
    const panel = await openPanel();
    expect(radio(panel, 'above').disabled).toBe(false);

    settings.update({ navPos: 'top' });
    await fixture.whenStable();

    expect(radio(panel, 'above').disabled).toBe(true);
    expect(panel.querySelector<HTMLButtonElement>('[role="switch"]')?.disabled).toBe(true);
  });
});
