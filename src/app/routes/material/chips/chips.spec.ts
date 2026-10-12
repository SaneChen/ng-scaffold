/**
 * Behavior tests for MaterialChips, replacing the generated creation test.
 * Checks accessible actions or progress semantics with the real English demo dictionary.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { MaterialChips } from './chips';

describe('MaterialChips', () => {
  it('should support its demo interaction and accessible state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialChips);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.value = 'Alex';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    await fixture.whenStable();
    expect(host.querySelectorAll('mat-chip-row')).toHaveLength(4);
    expect(input.value).toBe('');
    const remove = host.querySelector<HTMLButtonElement>('button[aria-label="Remove Alex"]')!;
    remove.click();
    await fixture.whenStable();
    expect(host.querySelectorAll('mat-chip-row')).toHaveLength(3);
    const first = host.querySelector<HTMLElement>('mat-chip-row')!;
    first.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await fixture.whenStable();
    const editor = first.querySelector<HTMLElement>('[matChipEditInput]')!;
    expect(editor.getAttribute('role')).toBe('textbox');
    expect(editor.getAttribute('aria-label')).toBe('Edit John');
    editor.textContent = 'Jonathan';
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true })
    );
    await fixture.whenStable();
    expect(first.textContent).toContain('Jonathan');
  });
});
