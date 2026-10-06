import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// [ng-scaffold] Step 1: hide the start-up loader of index.html once the first page has rendered.
import { inject } from '@angular/core';
import { Preloader } from '@core';
// [ng-scaffold] Step 2: the `title` signal below names the application in the document title.
import { PageTitleStrategy } from '@core';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('ng-scaffold');

  // [ng-scaffold] Step 1: pages are lazy loaded, so App's own first render is an empty shell. The
  // loader fades out once the router's first navigation has settled and its page has rendered.
  constructor() {
    inject(Preloader).hideAfterFirstNavigation();

    // [ng-scaffold] Step 2: page titles end with the application name ("Dashboard · ng-scaffold").
    inject(PageTitleStrategy).setAppName(this.title());
  }
}
