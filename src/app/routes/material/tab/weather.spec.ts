/**
 * Behavior tests for MaterialWeather; generated with the component and rewritten to test
 * navigation, validation or keyboard interaction instead of component creation.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialWeather } from './weather';
import { RouterTestingHarness } from '@angular/router/testing';
import { WEATHER_ROUTES } from './tab.routes';
describe('MaterialWeather', () => {
  it('should show the weather assigned to each lazy sibling route', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(WEATHER_ROUTES), provideTranslateService()],
    });
    const harness = await RouterTestingHarness.create('/sunny-tab');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(MaterialWeather);
    expect(harness.routeNativeElement?.textContent).toContain('demo.material.tab.sunny.text');
    await harness.navigateByUrl('/rainy-tab');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(MaterialWeather);
    expect(harness.routeNativeElement?.textContent).toContain('demo.material.tab.rainy.text');
    await harness.navigateByUrl('/foggy-tab');
    expect(harness.routeNativeElement?.textContent).toContain('demo.material.tab.foggy.text');
  });
});
