/**
 * Route of the select demo (`/forms/select`), with the select's translated texts.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 */
import { Routes } from '@angular/router';
import { provideDemoSelect } from '../../demo/demo-select';

const routes: Routes = [
  {
    path: '',
    title: 'menu.forms.select',
    providers: [provideDemoSelect()],
    loadComponent: () => import('./select').then(m => m.FormsSelect),
  },
];

export default routes;
