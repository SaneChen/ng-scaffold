/**
 * Unit tests for `SideSheet`.
 *
 * How this file was built:
 *   1. `yarn ng g service theme/side-sheet/side-sheet` generated the "should be created" test.
 *   2. Replaced it with checks of the dialog configuration in both directions (with a spy on
 *      `MatDialog.open`) and of caller overrides, and of an open sheet following a direction
 *      change (side, and the `dir` of its overlay) unless the caller fixed a direction.
 */
import { Directionality } from '@angular/cdk/bidi';
import { Dialog } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AppDirectionality, SettingsStore } from '@core';
import { SIDE_SHEET_CLASS, SideSheet } from './side-sheet';

@Component({ template: 'sheet' })
class Content {}

describe('SideSheet', () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Directionality, useExisting: AppDirectionality }],
    });
    open = vi.spyOn(TestBed.inject(MatDialog), 'open');
  });

  afterEach(() => localStorage.clear());

  it('should open a full-height panel at the right in LTR and at the left in RTL', () => {
    const sheet = TestBed.inject(SideSheet);
    sheet.open(Content, { ariaLabelledBy: 'title' });

    TestBed.inject(SettingsStore).update({ dir: 'rtl' });
    sheet.open(Content, { width: '400px' });

    expect(open.mock.calls[0][1]).toMatchObject({
      position: { right: '0' },
      height: '100%',
      panelClass: SIDE_SHEET_CLASS,
      ariaLabelledBy: 'title',
    });
    expect(open.mock.calls[1][1]).toMatchObject({ position: { left: '0' }, width: '400px' });
  });

  it('should move an open sheet to the other side when the direction changes', async () => {
    const ref = TestBed.inject(SideSheet).open(Content);
    const overlay = TestBed.inject(Dialog).getDialogById(ref.id)?.overlayRef;
    // The first render positions the new overlay once more; let that happen before the switch.
    TestBed.tick();
    const updatePosition = vi.spyOn(ref, 'updatePosition');

    TestBed.inject(SettingsStore).update({ dir: 'rtl' });
    TestBed.tick();

    expect(updatePosition).toHaveBeenCalledWith({ left: '0' });
    expect(overlay?.hostElement.getAttribute('dir')).toBe('rtl');
    // CDK's global strategy maps `left` through the overlay direction: the left edge of an RTL
    // overlay is its flex end. Positioning before the direction change would put it at the right.
    expect(overlay?.hostElement.style.justifyContent).toBe('flex-end');
    ref.close();
  });

  it('should keep a direction fixed by the caller', () => {
    const ref = TestBed.inject(SideSheet).open(Content, { direction: 'ltr' });
    const overlay = TestBed.inject(Dialog).getDialogById(ref.id)?.overlayRef;

    TestBed.inject(SettingsStore).update({ dir: 'rtl' });
    TestBed.tick();

    expect(overlay?.hostElement.getAttribute('dir')).toBe('ltr');
    ref.close();
  });
});
