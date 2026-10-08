/**
 * Form elements demo (`/forms/elements`): an inline form and the same profile form in one and two
 * columns, built with Signal Forms and Material form fields.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/elements` generated the component, template, styles and
 *      spec; the class was renamed `FormsElements`.
 *   2. The inline card is a small Signal Form (username, email, gender) whose current values are
 *      echoed below it; the other cards host `ProfileForm` with 1 and 2 columns.
 *
 * Why: ng-matero mixed template-driven and reactive forms on one page with English labels.
 */
import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeader } from '@shared';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileForm } from '../profile-form/profile-form';

@Component({
  imports: [
    FormField,
    JsonPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ProfileForm,
    TranslatePipe,
  ],
  selector: 'app-forms-elements',
  styleUrl: './elements.scss',
  templateUrl: './elements.html',
})
export class FormsElements {
  protected readonly filter = signal({ username: '', email: '', gender: '' });
  protected readonly inline = form(this.filter);
}
