/**
 * Translated texts of the extensions' `mtx-select` for the demo pages.
 *
 * How this file was built: written by hand (route providers; no generator for them).
 * `DemoSelectIntl` sets `MtxSelectIntl`'s texts ("No items found", "Clear all"…) from the demo
 * translations (`demo.select_intl.*`) and updates them with the language; `provideDemoSelect()`
 * provides it for a demo route.
 *
 * Why: ng-matero left these texts in English.
 */
import { effect, inject, Injectable, Provider } from '@angular/core';
import { MtxSelectIntl } from '@ng-matero/extensions/select';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class DemoSelectIntl extends MtxSelectIntl {
  readonly #translate = inject(TranslateService);

  constructor() {
    super();
    effect(() => {
      const text = (key: string) => String(this.#translate.instant(`demo.select_intl.${key}`));
      this.notFoundText = text('not_found');
      this.typeToSearchText = text('type_to_search');
      this.addTagText = text('add_tag');
      this.loadingText = text('loading');
      this.clearAllText = text('clear_all');
      this.changes.next();
    });
  }
}

/** Route providers of the demo areas with `mtx-select`. */
export function provideDemoSelect(): Provider[] {
  return [{ provide: MtxSelectIntl, useClass: DemoSelectIntl }];
}
