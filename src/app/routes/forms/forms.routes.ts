/**
 * Routes of the forms demo area (`/forms/...`), lazy loaded by app.routes.ts.
 *
 * How this file was built: written by hand (Angular CLI has no generator for route files);
 * `export default`, demo translations as in every demo area. Each page loads its own route file
 * with the providers only it needs (date adapters, formly, the select's texts), so a page does
 * not download the libraries of the others.
 */
import { Routes } from '@angular/router';
import { demoTranslationsReady, provideDemoTranslations } from '../demo/demo-translations';

const routes: Routes = [
  {
    path: '',
    providers: provideDemoTranslations(),
    canActivate: [demoTranslationsReady],
    children: [{ path: 'elements', loadChildren: () => import('./elements/elements.routes') }],
  },
];

export default routes;
