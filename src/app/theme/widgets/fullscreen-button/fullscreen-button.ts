/**
 * `<app-fullscreen-button>`: toggles the browser's full-screen mode.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/fullscreen-button --inline-template --inline-style`
 *      generated the component and its spec.
 *   2. Uses the native Fullscreen API on `DOCUMENT` (`requestFullscreen` / `exitFullscreen`); a
 *      signal follows `fullscreenchange`, so the icon and the translated label switch also when
 *      the user leaves full screen with Esc. Nothing is rendered where the API is unavailable
 *      (`fullscreenEnabled` is false, e.g. iPhone Safari or a sandboxed iframe).
 *
 * Why: replaces ng-matero's `screenfull` dependency, whose button kept the same icon and had no
 * accessible name.
 */
import { Component, DestroyRef, DOCUMENT, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  selector: 'app-fullscreen-button',
  styles: ``,
  template: `
    @if (supported) {
      @let label = (active() ? 'header.exit_fullscreen' : 'header.fullscreen') | translate;
      <button matIconButton type="button" [attr.aria-label]="label" (click)="toggle()">
        <mat-icon>{{ active() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
      </button>
    }
  `,
})
export class FullscreenButton {
  readonly #document = inject(DOCUMENT);

  protected readonly supported = this.#document.fullscreenEnabled === true;
  protected readonly active = signal(this.#document.fullscreenElement !== null);

  constructor() {
    const update = () => this.active.set(this.#document.fullscreenElement !== null);
    this.#document.addEventListener('fullscreenchange', update);
    inject(DestroyRef).onDestroy(() =>
      this.#document.removeEventListener('fullscreenchange', update)
    );
  }

  protected toggle(): void {
    // A refused request (e.g. not triggered by a user gesture) only leaves the mode unchanged.
    const request = this.active()
      ? this.#document.exitFullscreen()
      : this.#document.documentElement.requestFullscreen();
    request.catch(() => undefined);
  }
}
