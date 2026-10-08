/**
 * Unit tests for `FormsSelect` and its dialog.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/select` generated the "should create" test.
 *   2. Replaced it with tests for the people loaded with a loading state, the toggled option,
 *      a tag typed into the select and the tag functions, and for the dialog opened from a route
 *      with its own (child) translations.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MtxSelect } from '@ng-matero/extensions/select';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  provideChildTranslateService,
  provideTranslateService,
  TranslateService,
} from '@ngx-translate/core';
import { provideDemoSelect } from '../../demo/demo-select';
import { PEOPLE } from './people';
import { FormsSelect } from './select';

describe('FormsSelect', () => {
  let fixture: ComponentFixture<FormsSelect>;
  let host: HTMLElement;

  function selects(): MtxSelect[] {
    return fixture.debugElement
      .queryAll(el => el.componentInstance instanceof MtxSelect)
      .map(el => el.componentInstance as MtxSelect);
  }

  function echoes(): (string | undefined)[] {
    return Array.from(host.querySelectorAll('p > code'), code => code.textContent?.trim());
  }

  function button(text: string): HTMLButtonElement {
    const found = Array.from(host.querySelectorAll('button')).find(
      candidate => candidate.textContent?.trim() === text
    );
    if (!found) throw new Error(`No button ${text}`);
    return found;
  }

  beforeEach(() => {
    // jsdom has no popover API, which the select's panel uses to position itself.
    HTMLElement.prototype.showPopover ??= () => undefined;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), provideDemoSelect()],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      demo: {
        forms: {
          select: {
            source: { toggle: 'Toggle Saab' },
          },
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(FormsSelect);
    host = fixture.nativeElement;
  });

  it('should load the people with a loading state', async () => {
    fixture.detectChanges();
    expect(selects()[0].loading).toBe(true);
    expect(selects()[0].items).toEqual([]);

    await fixture.whenStable();

    expect(selects()[0].loading).toBe(false);
    expect(selects()[0].items).toEqual(PEOPLE);
    expect(echoes().slice(0, 4)).toEqual(['1', '1', '"Two"', '3']);
  });

  it('should toggle the disabled state of the Saab option', async () => {
    await fixture.whenStable();
    const saab = () => selects()[3].mtxOptions?.get(1);
    expect(saab()?.disabled).toBe(true);

    button('Toggle Saab').click();
    await fixture.whenStable();

    expect(saab()?.disabled).toBe(false);
  });

  it('should add a typed tag to the form value', async () => {
    await fixture.whenStable();
    const input = host.querySelectorAll<HTMLInputElement>('mtx-select input')[4];

    input.value = 'Lorem';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(echoes()[4]).toBe('"Lorem"');
  });

  it('should create tags with a function and on the server', async () => {
    await fixture.whenStable();
    const [, , , , , custom, server] = selects();
    vi.useFakeTimers();
    try {
      expect((custom.addTag as (name: string) => unknown)('Acme')).toEqual({
        name: 'Acme',
        tag: true,
      });

      const created = (server.addTag as (name: string) => Promise<unknown>)('Acme');
      fixture.detectChanges();
      expect(server.loading).toBe(true);

      await vi.advanceTimersByTimeAsync(1000);
      fixture.detectChanges();
      expect(server.loading).toBe(false);
      await expect(created).resolves.toEqual({ id: 5, name: 'Acme' });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FormsSelectDialog', () => {
  it('should open with a select and the translations of the page route', async () => {
    HTMLElement.prototype.showPopover ??= () => undefined;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            providers: [provideChildTranslateService(), provideDemoSelect()],
            component: FormsSelect,
          },
        ]),
        provideTranslateService({ lang: 'en' }),
      ],
    });
    const harness = await RouterTestingHarness.create('/');
    harness.routeDebugElement?.injector.get(TranslateService).setTranslation('en', {
      demo: { forms: { select: { dialog: { title: 'Select in a dialog', open: 'Open' } } } },
    });
    await harness.fixture.whenStable();

    Array.from(harness.routeNativeElement?.querySelectorAll('button') ?? [])
      .find(button => button.textContent?.trim() === 'Open')
      ?.click();
    await harness.fixture.whenStable();

    const dialog = document.querySelector('app-forms-select-dialog');
    expect(dialog?.querySelector('h2')?.textContent?.trim()).toBe('Select in a dialog');
    expect(dialog?.querySelector('mtx-select')).not.toBeNull();
  });
});
