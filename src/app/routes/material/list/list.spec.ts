/**
 * Behavior tests for MaterialList; generated with the component and rewritten to test
 * navigation, validation or keyboard interaction instead of component creation.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialList } from './list';
import { RouterTestingHarness } from '@angular/router/testing';
describe('MaterialList', () => {
  it('should navigate mailbox folders locally and update the current link and message content', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'list', component: MaterialList }]),
        provideTranslateService(),
      ],
    });
    const harness = await RouterTestingHarness.create('/list');
    const host = harness.routeNativeElement!;
    expect(host.querySelectorAll('img')).toHaveLength(3);
    await harness.navigateByUrl('/list?folder=trash');
    expect(host.querySelector('a[aria-current="page"]')?.textContent).toContain(
      'demo.material.list.trash'
    );
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      'demo.material.list.empty'
    );
    expect(host.querySelectorAll('img')).toHaveLength(0);
    await harness.navigateByUrl('/list?folder=invalid');
    expect(host.querySelector('a[aria-current="page"]')?.textContent).toContain(
      'demo.material.list.inbox'
    );
    expect(host.querySelectorAll('img')).toHaveLength(3);
  });
});
