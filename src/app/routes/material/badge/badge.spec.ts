/**
 * Behavior tests for MaterialBadge, replacing the generated creation test.
 * Checks accessible actions or progress semantics with the real English demo dictionary.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialBadge } from './badge';

describe('MaterialBadge', () => {
  it('should support its demo interaction and accessible state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialBadge);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const toggle = host.querySelector<HTMLButtonElement>('button[matbadge="7"]')!;
    expect(toggle.textContent).toContain('Hide badge');
    toggle.click();
    await fixture.whenStable();
    expect(toggle.textContent).toContain('Show badge');
    expect(toggle.hasAttribute('aria-describedby')).toBe(false);
    toggle.click();
    await fixture.whenStable();
    expect(toggle.textContent).toContain('Hide badge');
    expect(toggle.hasAttribute('aria-describedby')).toBe(true);
  });
});
