/**
 * Behavior tests for MaterialPaginator; generated creation test replaced with real data interactions.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import enUS from '../../../../../public/i18n/demo/en-US.json';
import { firstValueFrom } from 'rxjs';
import { By } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
import { MaterialPaginator } from './paginator';

describe('MaterialPaginator', () => {
  it('should update rows or page state through accessible controls', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', enUS);
    await firstValueFrom(translate.use('en-US'));
    const fixture = TestBed.createComponent(MaterialPaginator);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const next = host.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!;
    next.click();
    await fixture.whenStable();
    expect(host.querySelector('p[role="status"]')?.textContent).toContain('index: 1');
    const lengthInput = host.querySelector<HTMLInputElement>('input')!;
    lengthInput.value = '3';
    lengthInput.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    const paginator = fixture.debugElement.query(By.directive(MatPaginator))
      .componentInstance as MatPaginator;
    expect(paginator.length).toBe(3);
    expect(paginator.pageIndex).toBe(0);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    next.click();
    await fixture.whenStable();
    expect(paginator.pageIndex).toBe(0);
    const optionsInput = host.querySelectorAll<HTMLInputElement>('input')[2];
    optionsInput.value = '5, 0, invalid, 5, -2, 25';
    optionsInput.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(paginator.pageSizeOptions).toEqual([5, 25]);
    const sizeInput = host.querySelectorAll<HTMLInputElement>('input')[1];
    for (const invalid of ['1001', '1.5', '0', '']) {
      sizeInput.value = invalid;
      sizeInput.dispatchEvent(new Event('input', { bubbles: true }));
      sizeInput.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(paginator.pageSize).toBe(10);
      expect(sizeInput.getAttribute('aria-invalid')).toBe('true');
    }
    for (const invalid of ['1000001', '3.5', '-1', '']) {
      lengthInput.value = invalid;
      lengthInput.dispatchEvent(new Event('input', { bubbles: true }));
      lengthInput.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(paginator.length).toBe(3);
      expect(lengthInput.getAttribute('aria-invalid')).toBe('true');
    }
  });
});
