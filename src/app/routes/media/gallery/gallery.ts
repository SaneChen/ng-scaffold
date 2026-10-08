/**
 * Gallery demo (`/media/gallery`): photos opened in the photo viewer of @ng-matero/extensions.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/media/gallery` generated the component, template, styles and
 *      spec; the class was renamed `MediaGallery`.
 *   2. Thirty photos from public/images/pixabay (ng-matero's twenty Pixabay photos plus ten more
 *      from Pixabay, 21–30) as a responsive CSS grid of buttons with `NgOptimizedImage`
 *      thumbnails and translated captions.
 *   3. `MtxPhotoviewer` on each button opens the viewer at that photo, with translated titles and
 *      toolbar labels (`computed` from the translations). Escape closes it (the library handles
 *      arrows, zoom and rotation keys but not Escape), and closing returns focus to the button.
 *
 * Why: ng-matero made the `<img>` itself clickable (no keyboard access), described every photo as
 * "Gallery Image n" and left the viewer's labels in English.
 */
import { NgOptimizedImage } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, inject, Renderer2 } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MtxPhotoviewer } from '@ng-matero/extensions/photoviewer';
import { PageHeader } from '@shared';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type PhotoViewer from 'photoviewer';

/** The photos and their intrinsic sizes (NgOptimizedImage reserves the space). */
export const PHOTOS = [
  [1280, 850],
  [1280, 851],
  [960, 1280],
  [1280, 853],
  [1280, 862],
  [1280, 720],
  [1280, 874],
  [1280, 853],
  [1280, 853],
  [1280, 649],
  [1280, 854],
  [1280, 960],
  [1280, 853],
  [1280, 853],
  [1280, 960],
  [1280, 853],
  [1280, 784],
  [1280, 961],
  [1280, 767],
  [1280, 853],
  [1280, 851],
  [1280, 851],
  [1280, 853],
  [1280, 853],
  [1280, 853],
  [1280, 852],
  [1280, 800],
  [1280, 852],
  [1280, 853],
  [1280, 853],
].map(([width, height], i) => ({ src: `images/pixabay/${i + 1}.jpg`, width, height }));

const TOOLBAR = [
  'minimize',
  'maximize',
  'close',
  'zoomIn',
  'zoomOut',
  'prev',
  'next',
  'fullscreen',
  'actualSize',
  'rotateLeft',
  'rotateRight',
] as const;

@Component({
  imports: [MtxPhotoviewer, NgOptimizedImage, PageHeader, TranslatePipe],
  selector: 'app-media-gallery',
  styleUrl: './gallery.scss',
  templateUrl: './gallery.html',
})
export class MediaGallery {
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #document = inject(DOCUMENT);
  readonly #renderer = inject(Renderer2);
  /** Removes the Escape listener of the open viewer. */
  #stopEscape?: () => void;
  readonly #dialogs = new WeakMap<PhotoViewer, HTMLElement>();
  readonly #translations = toSignal(inject(TranslateService).stream('demo.media.gallery'));

  protected readonly photos = PHOTOS;

  /** The viewer's images with their translated titles. */
  protected readonly items = computed<PhotoViewer.Img[]>(() =>
    PHOTOS.map(({ src }, i) => ({ src, title: this.#text(`photos.${i + 1}`) }))
  );

  /** Viewer options per photo: its index, the translated toolbar, focus back on close. */
  protected readonly options = computed<PhotoViewer.Options[]>(() => {
    const i18n = Object.fromEntries(TOOLBAR.map(key => [key, this.#text(`viewer.${key}`)]));
    return PHOTOS.map((_, index) => ({
      index,
      i18n,
      callbacks: {
        opened: (viewer: PhotoViewer) => {
          const dialog = Array.from(
            this.#document.querySelectorAll<HTMLElement>('.photoviewer-modal')
          ).at(-1);
          if (dialog) this.#dialogs.set(viewer, dialog);
          this.#nameViewer(viewer, index);
          this.#closeOnEscape(viewer);
        },
        changed: (viewer: PhotoViewer, current: number) => this.#nameViewer(viewer, current),
        closed: (viewer: PhotoViewer) => {
          this.#dialogs.delete(viewer);
          this.#stopEscape?.();
          this.#focus(index);
        },
      },
    }));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#stopEscape?.());
  }

  #closeOnEscape(viewer: PhotoViewer): void {
    this.#stopEscape?.();
    this.#stopEscape = this.#renderer.listen(this.#document, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        viewer.close();
      }
    });
  }

  #nameViewer(viewer: PhotoViewer, index: number): void {
    const dialog = this.#dialogs.get(viewer);
    const title = viewer.images?.[index]?.title ?? this.items()[index]?.title;
    if (dialog && title) this.#renderer.setAttribute(dialog, 'aria-label', title);
  }

  #text(path: string): string {
    let value: unknown = this.#translations();
    for (const key of path.split('.')) {
      value = (value as Record<string, unknown> | undefined)?.[key];
    }
    return typeof value === 'string' ? value : '';
  }

  #focus(index: number): void {
    this.#host.querySelectorAll<HTMLButtonElement>('.photo')[index]?.focus();
  }
}
