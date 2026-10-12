/**
 * Behavior tests for MaterialTree; generated with the component and rewritten to test
 * navigation, validation or keyboard interaction instead of component creation.
 */
import { DIR_DOCUMENT } from '@angular/cdk/bidi';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialTree } from './tree';
describe('MaterialTree', () => {
  it.each(['ltr', 'rtl'])('should expand and collapse branches in %s', async direction => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: DIR_DOCUMENT, useValue: { documentElement: { dir: direction } } },
      ],
    });
    const fixture = TestBed.createComponent(MaterialTree);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const root = host.querySelector<HTMLElement>('mat-tree-node')!;
    expect(host.querySelectorAll('mat-tree-node')).toHaveLength(2);
    root.focus();
    root.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft',
        keyCode: direction === 'ltr' ? 39 : 37,
        bubbles: true,
      })
    );
    await fixture.whenStable();
    expect(root.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelectorAll('mat-tree-node')).toHaveLength(5);
    expect(host.textContent).toContain('demo.material.tree.apple');
    root.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight',
        keyCode: direction === 'ltr' ? 37 : 39,
        bubbles: true,
      })
    );
    await fixture.whenStable();
    expect(root.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelectorAll('mat-tree-node')).toHaveLength(2);
    expect(document.activeElement).toBe(root);
  });
});
