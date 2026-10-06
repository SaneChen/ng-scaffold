/**
 * `*appCan`: renders its template only for users who pass a permission rule.
 *
 * How this file was built:
 *   1. `yarn ng g directive core/permissions/can` generated the `[appCan]` directive and its spec.
 *   2. Added the inputs `appCan` (a role/permission name, a list of names — both meaning `only` —
 *      or a `{ only, except }` rule), `appCanExcept` and `appCanElse` (template shown otherwise),
 *      so the microsyntax reads `*appCan="'ADMIN'; except: 'GUEST'; else denied"`.
 *   3. A `computed()` picks the template from `PermissionStore.has()`; an `effect()` swaps the view
 *      only when that choice changes.
 *
 * Why: replaces ngx-permissions' `*ngxPermissionsOnly` / `*ngxPermissionsExcept` with one
 * structural directive that follows role changes through signals instead of subscriptions.
 */
import {
  computed,
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import { PermissionRule, PermissionStore } from './permission-store';

@Directive({
  selector: '[appCan]',
})
export class Can {
  readonly #store = inject(PermissionStore);
  readonly #template = inject(TemplateRef);
  readonly #container = inject(ViewContainerRef);

  /** Names that may see the template (`only`), or a whole `{ only, except }` rule. */
  readonly appCan = input.required<string | readonly string[] | PermissionRule>();
  /** Names that may not see the template (combined with `appCan`). */
  readonly appCanExcept = input<string | readonly string[]>();
  /** Template rendered instead for users who do not pass. */
  readonly appCanElse = input<TemplateRef<unknown> | null>(null);

  readonly #shown = computed(() => {
    const value = this.appCan();
    const rule: PermissionRule =
      typeof value === 'string' || Array.isArray(value)
        ? { only: value as string | readonly string[] }
        : { ...(value as PermissionRule) };
    rule.except ??= this.appCanExcept();
    return this.#store.has(rule) ? this.#template : this.appCanElse();
  });

  constructor() {
    effect(() => {
      const template = this.#shown();
      untracked(() => {
        this.#container.clear();
        if (template) {
          this.#container.createEmbeddedView(template);
        }
      });
    });
  }
}
