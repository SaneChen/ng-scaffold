/**
 * Unit tests for `AppDirectionality`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/settings/app-directionality` generated the "should be created"
 *      test.
 *   2. Added tests for the initial value, for following the `dir` setting (synchronously for
 *      `value`/`valueSignal`, once per switch for the `change` event) and for the
 *      `Directionality` provider registered in app.config.ts.
 */
import { Directionality } from '@angular/cdk/bidi';
import { TestBed } from '@angular/core/testing';
import { AppDirectionality } from './app-directionality';
import { SETTINGS_STORAGE_KEY, SettingsStore } from './settings-store';

describe('AppDirectionality', () => {
  let service: AppDirectionality;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Directionality, useExisting: AppDirectionality }],
    });
    service = TestBed.inject(AppDirectionality);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be the Directionality that CDK and Material components inject', () => {
    expect(TestBed.inject(Directionality)).toBe(service);
  });

  it('should start with the direction of the settings', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ dir: 'rtl' }));

    expect(TestBed.inject(AppDirectionality).value).toBe('rtl');
  });

  it('should report a new dir setting immediately, without waiting for effects', () => {
    TestBed.inject(SettingsStore).update({ dir: 'rtl' });

    expect(service.value).toBe('rtl');
    expect(service.valueSignal()).toBe('rtl');
  });

  it('should follow the dir setting and emit a change once per switch', () => {
    const changes: string[] = [];
    service.change.subscribe(dir => changes.push(dir));
    const settings = TestBed.inject(SettingsStore);

    settings.update({ dir: 'rtl' });
    TestBed.tick();
    expect(service.value).toBe('rtl');
    expect(service.valueSignal()).toBe('rtl');

    settings.update({ theme: 'dark' });
    TestBed.tick();
    expect(changes).toEqual(['rtl']);

    settings.update({ dir: 'ltr' });
    TestBed.tick();
    expect(changes).toEqual(['rtl', 'ltr']);
  });
});
