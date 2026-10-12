/**
 * Behavior tests for MaterialTab; generated with the component and rewritten to test
 * navigation, validation or keyboard interaction instead of component creation.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MaterialTab } from './tab';
import { RouterTestingHarness } from '@angular/router/testing';
import { WEATHER_ROUTES } from './tab.routes';
describe('MaterialTab', () => {
  it('should mark the routed tab active and keep the disabled breed tab unavailable', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'tab', component: MaterialTab, children: WEATHER_ROUTES }]),
        provideTranslateService(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    const harness = await RouterTestingHarness.create('/tab');
    await harness.fixture.whenStable();
    const host = harness.routeNativeElement!;
    expect(host.querySelector('a[aria-selected="true"]')?.getAttribute('href')).toBe(
      '/tab/sunny-tab'
    );
    await harness.navigateByUrl('/tab/rainy-tab');
    await harness.fixture.whenStable();
    expect(host.querySelector('a[aria-selected="true"]')?.getAttribute('href')).toBe(
      '/tab/rainy-tab'
    );
    expect(
      host.querySelector('mat-tab-group [role="tab"][aria-disabled="true"]')?.textContent
    ).toContain('demo.material.tab.beagle.label');
  });
});
