/**
 * Route of the datepicker demo (`/material/datepicker`), with the demo date adapter, locale and
 * translated labels.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 */
import { Routes } from '@angular/router';
import { provideDemoDates } from '../../demo/demo-dates';

const routes: Routes = [
  {
    path: '',
    title: 'menu.material.form-controls.datepicker',
    providers: [provideDemoDates()],
    loadComponent: () => import('./datepicker').then(m => m.MaterialDatepicker),
  },
];

export default routes;
