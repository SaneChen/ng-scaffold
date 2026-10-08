/**
 * Select demo (`/forms/select`): the `mtx-select` of @ng-matero/extensions with items from a
 * loader, arrays and inline options, tags, and inside a dialog.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/select` generated the component, template, styles and
 *      spec; the class was renamed `FormsSelect`.
 *   2. One Signal Form holds every example's value (`[formField]`, the select being a
 *      ControlValueAccessor) and the page echoes them. The people load through `resource()`
 *      (with its loading state); tags are added plainly, by a function and by a promise with a
 *      loading state; a button toggles a car option's `disabled`.
 *   3. The texts are translated; the sample names stay as data. The dialog opens under the
 *      page's injector: the root `MatDialog` would otherwise give it the root `TranslateService`,
 *      without the demo translations of the route.
 *
 * Why: ng-matero bound everything with `ngModel` and plain fields (stale under OnPush), loaded
 * the people twice and left the texts in English.
 */
import { JsonPipe } from '@angular/common';
import { Component, inject, Injector, resource, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MtxOption, MtxSelect, MtxSelectTagTemplate } from '@ng-matero/extensions/select';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';
import { loadPeople, PEOPLE } from './people';
import { FormsSelectDialog } from './select-dialog';

interface Company {
  id?: number;
  name: string;
  tag?: boolean;
}

@Component({
  imports: [
    FormField,
    JsonPipe,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MtxOption,
    MtxSelect,
    MtxSelectTagTemplate,
    PageHeader,
    TranslatePipe,
  ],
  selector: 'app-forms-select',
  styleUrl: './select.scss',
  templateUrl: './select.html',
})
export class FormsSelect {
  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);

  protected readonly people = resource({ loader: () => loadPeople() });
  protected readonly peopleArray = PEOPLE;
  protected readonly simpleItems = [true, 'Two', 3];
  protected readonly cars = signal([
    { id: 1, name: 'Volvo', disabled: false },
    { id: 2, name: 'Saab', disabled: true },
    { id: 3, name: 'Opel', disabled: false },
    { id: 4, name: 'Audi', disabled: false },
  ]);
  protected readonly companies: Company[] = ['Miškas', 'Žalias', 'Flexigen'].map((name, id) => ({
    id,
    name,
  }));
  protected readonly creating = signal(false);

  protected readonly values = signal({
    person: 1 as number | null,
    person2: 1 as number | null,
    simple: 'Two' as boolean | string | number | null,
    car: 3 as number | string | null,
    tag: null as string | null,
    tags: [] as Company[],
    serverTags: [] as Company[],
    freeTags: [] as string[],
  });
  protected readonly form = form(this.values);

  protected toggleSaab(): void {
    this.cars.update(cars =>
      cars.map(car => (car.id === 2 ? { ...car, disabled: !car.disabled } : car))
    );
  }

  protected readonly addTag = (name: string): Company => ({ name, tag: true });

  /** Creates the tag "on the server": resolves after a second, with a loading state. */
  protected readonly addTagOnServer = (name: string): Promise<Company> => {
    this.creating.set(true);
    return new Promise(resolve =>
      setTimeout(() => {
        this.creating.set(false);
        resolve({ id: 5, name });
      }, 1000)
    );
  };

  /** Opens the dialog under this page's injector, which has the demo translations. */
  protected openDialog(): void {
    this.#dialog.open(FormsSelectDialog, { injector: this.#injector });
  }
}
