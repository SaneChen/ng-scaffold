/**
 * Route of the form elements demo (`/forms/elements`), with the date adapter of its datepickers.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 */
import { Routes } from '@angular/router';
import { provideDemoDates } from '../../demo/demo-dates';

const routes: Routes = [
  {
    path: '',
    title: 'menu.forms.form-elements',
    providers: [provideDemoDates()],
    loadComponent: () => import('./elements').then(m => m.FormsElements),
  },
];

export default routes;
