/**
 * Route of the date-time demo (`/forms/datetime`), with the date-time picker's adapter, locale
 * and translated labels.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 */
import { Routes } from '@angular/router';
import { provideDemoDatetimes } from '../../demo/demo-datetimes';

const routes: Routes = [
  {
    path: '',
    title: 'menu.forms.datetime',
    providers: [provideDemoDatetimes()],
    loadComponent: () => import('./datetime').then(m => m.FormsDatetime),
  },
];

export default routes;
