/**
 * MaterialChips demo, with translated labels and accessible Material controls.
 * How this file was built: `yarn ng g component routes/material/chips` generated
 * the component and spec; the examples use signals, local resources and M3 theme variants.
 */
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { NgOptimizedImage } from '@angular/common';
import { signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatChipsModule, MatChipInputEvent, MatChipEditedEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  imports: [
    MatCardModule,
    TranslatePipe,
    PageHeader,
    NgOptimizedImage,
    FormField,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  selector: 'app-material-chips',
  styleUrl: './chips.scss',
  templateUrl: './chips.html',
})
export class MaterialChips {
  protected readonly key = 'demo.material.chips';
  protected readonly flowers = ['carnation', 'iris', 'buttercup'];
  protected readonly variants = ['primary', 'tertiary', 'error'];
  protected readonly people = signal([
    { id: 1, name: 'John' },
    { id: 2, name: 'Mary' },
    { id: 3, name: 'Bobby' },
  ]);
  protected readonly values = signal({ contributor: '' });
  protected readonly form = form(this.values);
  private nextId = 4;
  protected add(event: MatChipInputEvent): void {
    const name = event.value.trim();
    if (name) {
      this.people.update(people => [...people, { id: this.nextId++, name }]);
    }
    this.form().reset({ contributor: '' });
    event.chipInput.clear();
  }
  protected remove(id: number): void {
    this.people.update(people => people.filter(person => person.id !== id));
  }
  protected edit(id: number, event: MatChipEditedEvent): void {
    const name = event.value.trim();
    if (!name) {
      this.remove(id);
      return;
    }
    this.people.update(people =>
      people.map(person => (person.id === id ? { ...person, name } : person))
    );
  }
}
