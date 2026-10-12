/**
 * Routes of the Material demo area (`/material/...`), below the demo translations.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 * Pages that need their own providers (the datepicker's date adapter) have a route file of their
 * own, so the providers load with the page.
 */
import { Routes } from '@angular/router';
import { demoTranslationsReady, provideDemoTranslations } from '../demo/demo-translations';

const routes: Routes = [
  {
    path: '',
    providers: provideDemoTranslations(),
    canActivate: [demoTranslationsReady],
    children: [
      // Form controls
      {
        path: 'autocomplete',
        title: 'menu.material.form-controls.autocomplete',
        loadComponent: () =>
          import('./autocomplete/autocomplete').then(m => m.MaterialAutocomplete),
      },
      {
        path: 'checkbox',
        title: 'menu.material.form-controls.checkbox',
        loadComponent: () => import('./checkbox/checkbox').then(m => m.MaterialCheckbox),
      },
      { path: 'datepicker', loadChildren: () => import('./datepicker/datepicker.routes') },
      {
        path: 'form-field',
        title: 'menu.material.form-controls.form-field',
        loadComponent: () => import('./form-field/form-field').then(m => m.MaterialFormField),
      },
      {
        path: 'input',
        title: 'menu.material.form-controls.input',
        loadComponent: () => import('./input/input').then(m => m.MaterialInput),
      },
      {
        path: 'radio',
        title: 'menu.material.form-controls.radio',
        loadComponent: () => import('./radio/radio').then(m => m.MaterialRadio),
      },
      {
        path: 'select',
        title: 'menu.material.form-controls.select',
        loadComponent: () => import('./select/select').then(m => m.MaterialSelect),
      },
      {
        path: 'slider',
        title: 'menu.material.form-controls.slider',
        loadComponent: () => import('./slider/slider').then(m => m.MaterialSlider),
      },
      {
        path: 'slide-toggle',
        title: 'menu.material.form-controls.slide-toggle',
        loadComponent: () => import('./slide-toggle/slide-toggle').then(m => m.MaterialSlideToggle),
      },
      // Layout
      {
        path: 'card',
        title: 'menu.material.layout.card',
        loadComponent: () => import('./card/card').then(m => m.MaterialCard),
      },
      {
        path: 'divider',
        title: 'menu.material.layout.divider',
        loadComponent: () => import('./divider/divider').then(m => m.MaterialDivider),
      },
      {
        path: 'grid-list',
        title: 'menu.material.layout.grid-list',
        loadComponent: () => import('./grid-list/grid-list').then(m => m.MaterialGridList),
      },
      {
        path: 'expansion',
        title: 'menu.material.layout.expansion',
        loadComponent: () =>
          import('./expansion-panel/expansion-panel').then(m => m.MaterialExpansionPanel),
      },
      // Navigation
      {
        path: 'button',
        title: 'menu.material.buttons-indicators.button',
        loadComponent: () => import('./button/button').then(m => m.MaterialButton),
      },
      {
        path: 'button-toggle',
        title: 'menu.material.buttons-indicators.button-toggle',
        loadComponent: () =>
          import('./button-toggle/button-toggle').then(m => m.MaterialButtonToggle),
      },
      {
        path: 'badge',
        title: 'menu.material.buttons-indicators.badge',
        loadComponent: () => import('./badge/badge').then(m => m.MaterialBadge),
      },
      {
        path: 'icon',
        title: 'menu.material.buttons-indicators.icon',
        loadComponent: () => import('./icon/icon').then(m => m.MaterialIcon),
      },
      {
        path: 'progress-bar',
        title: 'menu.material.buttons-indicators.progress-bar',
        loadComponent: () => import('./progress-bar/progress-bar').then(m => m.MaterialProgressBar),
      },
      {
        path: 'progress-spinner',
        title: 'menu.material.buttons-indicators.progress-spinner',
        loadComponent: () =>
          import('./progress-spinner/progress-spinner').then(m => m.MaterialProgressSpinner),
      },
      {
        path: 'ripple',
        title: 'menu.material.buttons-indicators.ripple',
        loadComponent: () => import('./ripple/ripple').then(m => m.MaterialRipple),
      },
      {
        path: 'chips',
        title: 'menu.material.buttons-indicators.chips',
        loadComponent: () => import('./chips/chips').then(m => m.MaterialChips),
      },
      {
        path: 'list',
        title: 'menu.material.layout.list',
        loadComponent: () => import('./list/list').then(m => m.MaterialList),
      },
      {
        path: 'stepper',
        title: 'menu.material.layout.stepper',
        loadComponent: () => import('./stepper/stepper').then(m => m.MaterialStepper),
      },
      { path: 'tab', loadChildren: () => import('./tab/tab.routes') },
      {
        path: 'tree',
        title: 'menu.material.layout.tree',
        loadComponent: () => import('./tree/tree').then(m => m.MaterialTree),
      },
      {
        path: 'menu',
        title: 'menu.material.navigation.menu',
        loadComponent: () => import('./menu/menu').then(m => m.MaterialMenu),
      },
      {
        path: 'sidenav',
        title: 'menu.material.navigation.sidenav',
        children: [
          {
            path: '',
            loadComponent: () => import('./sidenav/sidenav').then(m => m.MaterialSidenav),
          },
          {
            path: 'basic',
            loadComponent: () =>
              import('./sidenav/basic-sidenav').then(m => m.MaterialBasicSidenav),
          },
          {
            path: 'mobile',
            loadComponent: () =>
              import('./sidenav/mobile-sidenav').then(m => m.MaterialMobileSidenav),
          },
          {
            path: 'dual',
            loadComponent: () => import('./sidenav/dual-sidenav').then(m => m.MaterialDualSidenav),
          },
        ],
      },
      {
        path: 'toolbar',
        title: 'menu.material.navigation.toolbar',
        loadComponent: () => import('./toolbar/toolbar').then(m => m.MaterialToolbar),
      },
    ],
  },
];

export default routes;
