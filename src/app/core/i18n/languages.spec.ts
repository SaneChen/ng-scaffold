/**
 * Unit tests for `resolveLanguage()`.
 *
 * How this file was built: written by hand next to the hand-written languages.ts (no generator
 * creates specs for plain functions).
 */
import { DEFAULT_LANGUAGE, LANGUAGES, resolveLanguage } from './languages';

describe('resolveLanguage', () => {
  it('should keep an explicitly chosen supported language', () => {
    expect(resolveLanguage('zh-TW', ['en-US'])).toBe('zh-TW');
  });

  it('should use the first browser language that matches when the setting is auto', () => {
    expect(resolveLanguage('auto', ['fr-FR', 'zh-CN', 'en-US'])).toBe('zh-CN');
  });

  it('should map regional and script variants to the closest translation', () => {
    expect(resolveLanguage('auto', ['zh-HK'])).toBe('zh-TW');
    expect(resolveLanguage('auto', ['zh-Hant'])).toBe('zh-TW');
    expect(resolveLanguage('auto', ['zh-SG'])).toBe('zh-CN');
    expect(resolveLanguage('auto', ['zh'])).toBe('zh-CN');
    expect(resolveLanguage('auto', ['en-GB'])).toBe('en-US');
  });

  it('should match tags case-insensitively', () => {
    expect(resolveLanguage('auto', ['ZH-tw'])).toBe('zh-TW');
  });

  it('should fall back to the browser languages when the stored code is not shipped', () => {
    expect(resolveLanguage('de-DE', ['zh-CN'])).toBe('zh-CN');
  });

  it('should fall back to the default language when nothing matches', () => {
    expect(resolveLanguage('auto', ['fr-FR', 'not a tag'])).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage('auto', [])).toBe(DEFAULT_LANGUAGE);
  });

  it('should list the default language', () => {
    expect(LANGUAGES.map(({ code }) => code)).toContain(DEFAULT_LANGUAGE);
  });
});
