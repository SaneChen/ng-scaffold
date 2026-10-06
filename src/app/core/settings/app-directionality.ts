/**
 * CDK `Directionality` that follows the `dir` setting of `SettingsStore`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/settings/app-directionality` generated an empty `@Service()` class
 *      and its spec.
 *   2. Made it extend `Directionality` from `@angular/cdk/bidi` (a `@Service()` in CDK v22 with a
 *      writable `valueSignal` and a `change` emitter).
 *   3. Overrode `valueSignal` with a `linkedSignal()` of the `dir` setting.
 *   4. Added an `effect()` that emits `change` once per direction switch.
 *   5. app.config.ts provides it as `{ provide: Directionality, useExisting: AppDirectionality }`.
 *
 * Why: the default `Directionality` reads `<html dir>` once, when it is first injected, and never
 * again. Overlays, menus, sliders and the sidenav would keep the old direction after the user
 * switches between LTR and RTL. `linkedSignal()` derives the value from the setting without
 * waiting for an effect, so `value` and `valueSignal()` agree with `SettingsStore` immediately:
 * a handler that switches `dir` and then opens a menu positions it for the new direction.
 * Components that read `valueSignal` update automatically; subscribers of `change` (CDK overlays,
 * Material components) are notified as before.
 */
import { Directionality } from '@angular/cdk/bidi';
import { effect, inject, linkedSignal, Service, untracked } from '@angular/core';
import { SettingsStore } from './settings-store';

@Service()
export class AppDirectionality extends Directionality {
  readonly #settings = inject(SettingsStore);

  /**
   * The `dir` setting. Declared after `#settings`, which it reads: class fields are initialized
   * in order, after the base constructor has run.
   */
  override readonly valueSignal = linkedSignal(() => this.#settings.options().dir);

  constructor() {
    super();
    // `change` is an event, not state: emit it once per switch, never for the initial value.
    let emitted = untracked(this.valueSignal);
    effect(() => {
      const dir = this.valueSignal();
      if (dir !== emitted) {
        emitted = dir;
        this.change.emit(dir);
      }
    });
  }
}
