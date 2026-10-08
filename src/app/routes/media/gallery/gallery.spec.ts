/**
 * Unit tests for `MediaGallery`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/media/gallery` generated the "should create" test.
 *   2. Replaced it with tests of the photo buttons (translated names, thumbnails, a caption for
 *      each of the 30 photos), the viewer's translated titles and toolbar, Escape closing an open
 *      viewer, and focus returning to the photo's button when the viewer closes.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MtxPhotoviewer } from '@ng-matero/extensions/photoviewer';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import type PhotoViewer from 'photoviewer';
import demoEnglish from '../../../../../public/i18n/demo/en-US.json';
import { MediaGallery, PHOTOS } from './gallery';

describe('MediaGallery', () => {
  let fixture: ComponentFixture<MediaGallery>;

  function viewers(): MtxPhotoviewer[] {
    return fixture.debugElement
      .queryAll(el => el.injector.get(MtxPhotoviewer, null) !== null && el.name === 'button')
      .map(el => el.injector.get(MtxPhotoviewer));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      demo: {
        media: {
          gallery: {
            open: 'Enlarge: {{title}}',
            photos: { 1: 'Skyscrapers', 2: 'Temple' },
            viewer: { close: 'Close', next: 'Next photo' },
          },
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(MediaGallery);
    await fixture.whenStable();
  });

  it('should offer every photo as a named button', () => {
    const buttons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button.photo')
    );

    expect(buttons).toHaveLength(PHOTOS.length);
    expect(buttons[1].getAttribute('aria-label')).toBe('Enlarge: Temple');
    expect(buttons[1].querySelector('img')?.getAttribute('src')).toBe('images/pixabay/2.jpg');
    expect(buttons[1].querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('should have a caption for each of the 30 photos', () => {
    const captions: Record<string, string> = demoEnglish.demo.media.gallery.photos;

    expect(PHOTOS).toHaveLength(30);
    expect(PHOTOS.map((_, i) => captions[i + 1])).not.toContain(undefined);
  });

  it('should give the viewer translated titles and labels and start at the photo', () => {
    const viewer = viewers()[1];

    expect(viewer.images[0]).toEqual({ src: 'images/pixabay/1.jpg', title: 'Skyscrapers' });
    expect(viewer.options?.index).toBe(1);
    expect(viewer.options?.i18n).toMatchObject({ close: 'Close', next: 'Next photo' });
  });

  it('should close the viewer on Escape and focus the photo again', () => {
    const callbacks = viewers()[1].options?.callbacks;
    const viewer = { close: vi.fn() } as unknown as PhotoViewer;

    callbacks?.opened?.(viewer);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(viewer.close).toHaveBeenCalledTimes(1);

    callbacks?.closed?.(viewer);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelectorAll('button.photo')[1]);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(viewer.close).toHaveBeenCalledTimes(1);
  });

  it('should name the viewer dialog and update it when the photo changes', () => {
    const dialog = document.body.appendChild(document.createElement('div'));
    dialog.className = 'photoviewer-modal';
    dialog.setAttribute('role', 'dialog');
    const callbacks = viewers()[1].options?.callbacks;
    const viewer = { close: vi.fn() } as unknown as PhotoViewer;
    try {
      callbacks?.opened?.(viewer);
      expect(dialog.getAttribute('aria-label')).toBe('Temple');
      callbacks?.changed?.(viewer, 0);
      expect(dialog.getAttribute('aria-label')).toBe('Skyscrapers');
      callbacks?.closed?.(viewer);
    } finally {
      dialog.remove();
    }
  });
});
