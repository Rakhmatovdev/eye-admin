import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useT } from './useT';
import { useLocaleStore } from '../store/localeStore';
import { DEFAULT_LOCALE } from '../lib/i18n';

describe('useT', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
  });

  it('translates a dotted key using the current (default uz) locale', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('nav.dashboard')).toBe('Boshqaruv paneli');
  });

  it('re-resolves translations when the locale store changes', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('login.submit')).toBe('Kirish');

    act(() => {
      useLocaleStore.getState().setLocale('en');
    });

    expect(result.current('login.submit')).toBe('Authenticate');
  });

  it('falls back to the raw key when it is missing from the dictionary', () => {
    const { result } = renderHook(() => useT());
    // @ts-expect-error deliberately passing a key that does not exist
    expect(result.current('nonexistent.key')).toBe('nonexistent.key');
  });
});
