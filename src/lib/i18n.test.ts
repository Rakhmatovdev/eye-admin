import { describe, it, expect } from 'vitest';
import { dictionaries, DEFAULT_LOCALE, LOCALES, type TKey } from './i18n';

describe('i18n dictionaries', () => {
  it('defaults to uz', () => {
    expect(DEFAULT_LOCALE).toBe('uz');
  });

  it('lists uz, ru, en in LOCALES', () => {
    expect(LOCALES.map((l) => l.code)).toEqual(['uz', 'ru', 'en']);
  });

  it('has a dictionary for every locale', () => {
    expect(Object.keys(dictionaries).sort()).toEqual(['en', 'ru', 'uz']);
  });

  // NOTE: this checks a fixed baseline of the existing app-chrome keys (nav /
  // common / login / settings) that the Login and Settings pages already
  // depend on, rather than asserting full parity across every key in the en
  // dictionary. Full parity isn't a safe assumption right now — a parallel,
  // in-progress task is actively adding new page-body keys to `en` before
  // mirroring them into `ru`/`uz`.
  const baselineKeys: TKey[] = [
    'nav.dashboard',
    'nav.settings',
    'nav.logout',
    'common.save',
    'common.cancel',
    'common.loading',
    'login.email',
    'login.password',
    'login.submit',
    'login.mfaPrompt',
    'login.mfaSubmit',
    'settings.changePassword',
    'settings.changePasswordSubmit',
    'settings.currentPassword',
    'settings.newPassword',
  ];

  it('resolves every baseline chrome key to a non-empty string in every locale', () => {
    for (const locale of Object.keys(dictionaries) as (keyof typeof dictionaries)[]) {
      for (const key of baselineKeys) {
        expect(dictionaries[locale][key], `${locale}.${key}`).toEqual(expect.any(String));
        expect(dictionaries[locale][key]?.length ?? 0, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('resolves a namespaced key (nav.dashboard) to a different string per locale', () => {
    const key: TKey = 'nav.dashboard';
    expect(dictionaries.en[key]).toBe('Dashboard');
    expect(dictionaries.ru[key]).toBe('Панель управления');
    expect(dictionaries.uz[key]).toBe('Boshqaruv paneli');
  });

  it('resolves a login.* key consistently across locales', () => {
    const key: TKey = 'login.submit';
    expect(dictionaries.uz[key]).toBe('Kirish');
    expect(dictionaries.en[key]).toBe('Authenticate');
  });
});
