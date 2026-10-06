/**
 * Unit tests for `scheduleAt()` (hand-written: the function has no generator).
 */
import { scheduleAt } from './schedule-at';

describe('scheduleAt', () => {
  beforeEach(() => vi.useFakeTimers({ now: 0 }));
  afterEach(() => vi.useRealTimers());

  it('should run the callback at the given time, or at once when it has passed', () => {
    const callback = vi.fn();
    scheduleAt(1000, callback);
    scheduleAt(-5, callback);

    vi.advanceTimersByTime(0);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should wait longer than the 24.8-day limit of setTimeout', () => {
    const callback = vi.fn();
    const thirtyDays = 30 * 24 * 3600 * 1000;
    scheduleAt(thirtyDays, callback);

    vi.advanceTimersByTime(thirtyDays - 1);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not run a cancelled callback', () => {
    const callback = vi.fn();
    scheduleAt(10, callback)();

    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });
});
