/**
 * Route of the dynamic forms demo (`/forms/dynamic`), with formly and the select's texts.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 */
import { Routes } from '@angular/router';
import { provideDemoSelect } from '../../demo/demo-select';
import { provideDemoFormly } from '../demo-formly';

const routes: Routes = [
  {
    path: '',
    title: 'menu.forms.dynamic-form',
    providers: [provideDemoSelect(), provideDemoFormly()],
    loadComponent: () => import('./dynamic').then(m => m.FormsDynamic),
  },
];

export default routes;
