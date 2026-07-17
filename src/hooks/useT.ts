import { useCallback } from 'react';
import { useLocaleStore } from '../store/localeStore';
import { dictionaries, type TKey } from '../lib/i18n';

/** Translation hook for the app chrome. Re-renders when the locale changes. */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const t = useCallback((key: TKey) => dictionaries[locale][key] ?? key, [locale]);
  return t;
}
