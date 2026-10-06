/**
 * `AuthLayout`: the frame of the sign-in and sign-up pages.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/auth-layout` generated the component, template, styles and spec.
 *   2. A `<main>` landmark that centers the routed page over ng-matero's soft gradient background,
 *      plus the language menu, so visitors can switch language before signing in.
 *
 * Why: the login and sign-up pages (lazy loaded) only bring their card; the frame is shared.
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateButton } from '../widgets/translate-button/translate-button';

@Component({
  imports: [RouterOutlet, TranslateButton],
  selector: 'app-auth-layout',
  styleUrl: './auth-layout.scss',
  templateUrl: './auth-layout.html',
})
export class AuthLayout {}
