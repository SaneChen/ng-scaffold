/**
 * Consistency check of the shipped translation files (hand-written: no generator for it).
 *
 * Every key of public/i18n/en-US.json must exist in zh-CN and zh-TW and the other way round, so a
 * new feature cannot ship a text in one language only (the English fallback would hide it).
 */
import enUS from '../../../../public/i18n/en-US.json';
import zhCN from '../../../../public/i18n/zh-CN.json';
import zhTW from '../../../../public/i18n/zh-TW.json';

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe('public/i18n', () => {
  it('should have the same keys in every language', () => {
    const english = keys(enUS).sort();

    expect(keys(zhCN).sort()).toEqual(english);
    expect(keys(zhTW).sort()).toEqual(english);
  });
});
