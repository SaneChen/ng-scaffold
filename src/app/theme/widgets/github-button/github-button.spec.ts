/**
 * Unit tests for `GithubButton`.
 *
 * How this file was built:
 *   1. `yarn ng g component theme/widgets/github-button --inline-template --inline-style`
 *      generated the "should create" test.
 *   2. Replaced it with a check of the link target, its new-tab safety and its accessible name.
 */
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { GithubButton, REPOSITORY_URL } from './github-button';

describe('GithubButton', () => {
  it('should open the repository in a new tab with an accessible name', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(GithubButton);
    await fixture.whenStable();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.href).toBe(REPOSITORY_URL);
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
    expect(link.getAttribute('aria-label')).toBe('header.github');
  });
});
