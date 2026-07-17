import React from 'react';
import { useLocaleStore } from '../../store/localeStore';
import { LOCALES } from '../../lib/i18n';

export const LocaleSwitcher: React.FC = () => {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className="flex items-center gap-0.5 bg-gray-950 border border-gray-800 rounded-lg p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          className={`px-2 py-1 rounded-md text-xxs font-bold transition-all ${
            locale === l.code
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
