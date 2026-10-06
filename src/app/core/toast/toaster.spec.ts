/**
 * Unit tests for `Toaster`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/toast/toaster` generated the "should be created" test.
 *   2. Added tests that messages reach `HotToastService` once the library has loaded (its methods
 *      spied on, no toast rendered): errors as dismissible alerts with a translated close label,
 *      and HTML in messages escaped.
 */
import { TestBed } from '@angular/core/testing';
import { HotToastService } from '@ngxpert/hot-toast';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ERROR_TOAST_DURATION, Toaster } from './toaster';

describe('Toaster', () => {
  let toaster: Toaster;
  let error: ReturnType<typeof vi.spyOn>;
  let success: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    error = vi.spyOn(HotToastService.prototype, 'error').mockReturnValue(undefined as never);
    success = vi.spyOn(HotToastService.prototype, 'success').mockReturnValue(undefined as never);
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('zh-CN', { close: '关闭' });
    translate.use('zh-CN');
    toaster = TestBed.inject(Toaster);
  });

  afterEach(() => vi.restoreAllMocks());

  it('should show errors as dismissible alerts with a translated close label', async () => {
    toaster.error('Failed');

    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith('Failed', {
        role: 'alert',
        ariaLive: 'assertive',
        duration: ERROR_TOAST_DURATION,
        dismissible: true,
        closeLabel: '关闭',
      })
    );
  });

  it('should escape HTML, since hot-toast renders strings as markup', async () => {
    toaster.success('<img src=x onerror=alert(1)> & "done"');

    await vi.waitFor(() =>
      expect(success).toHaveBeenCalledWith(
        '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;done&quot;'
      )
    );
  });
});
