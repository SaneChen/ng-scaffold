/**
 * Checkbox demo (`/material/checkbox`): `mat-checkbox` without a visible label, standalone,
 * disabled, indeterminate, in a nested checklist and in colour variants.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/material/checkbox` generated the component, template, styles
 *      and spec; the class was renamed `MaterialCheckbox`.
 *   2. The checklist is a signal of task lists: a parent is checked when all its tasks are,
 *      indeterminate when some are, and checking it sets them all (immutable updates).
 *   3. The variants use the `.tertiary` / `.error` classes of the demo styles (M3 has no `color`).
 *
 * Why: ng-matero mutated the tasks through `ngModel` and used M2 colours.
 */
import { Component, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

interface Task {
  /** Translation key under `demo.material.checkbox.tasks`. */
  name: string;
  done: boolean;
}

interface TaskList {
  name: string;
  tasks: Task[];
}

@Component({
  imports: [MatCardModule, MatCheckboxModule, PageHeader, TranslatePipe],
  selector: 'app-material-checkbox',
  styleUrl: './checkbox.scss',
  templateUrl: './checkbox.html',
})
export class MaterialCheckbox {
  protected readonly lists = signal<TaskList[]>([
    {
      name: 'reminders',
      tasks: [
        { name: 'cook_dinner', done: false },
        { name: 'read_spec', done: false },
        { name: 'upgrade_angular', done: false },
      ],
    },
    {
      name: 'groceries',
      tasks: [
        { name: 'eggs', done: false },
        { name: 'protein_powder', done: false },
        { name: 'almond_flour', done: false },
      ],
    },
  ]);

  protected allDone(list: TaskList): boolean {
    return list.tasks.every(task => task.done);
  }

  protected someDone(list: TaskList): boolean {
    return list.tasks.some(task => task.done) && !this.allDone(list);
  }

  protected setAll(index: number, done: boolean): void {
    this.lists.update(lists =>
      lists.map((list, i) =>
        i === index ? { ...list, tasks: list.tasks.map(task => ({ ...task, done })) } : list
      )
    );
  }

  protected setTask(index: number, taskIndex: number, done: boolean): void {
    this.lists.update(lists =>
      lists.map((list, i) =>
        i === index
          ? {
              ...list,
              tasks: list.tasks.map((task, t) => (t === taskIndex ? { ...task, done } : task)),
            }
          : list
      )
    );
  }
}
