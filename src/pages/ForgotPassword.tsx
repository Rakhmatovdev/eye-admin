import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MailQuestion } from 'lucide-react';
import axios from 'axios';
import { authApi } from '../api/auth';
import { useT } from '../hooks/useT';
import { LocaleSwitcher } from '../components/ui/LocaleSwitcher';

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || err.message || fallback;
  }
  return fallback;
}

export const ForgotPassword: React.FC = () => {
  const t = useT();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState<string | null>(null);

  const forgotM = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onMutate: () => {
      setError('');
      setDevLink(null);
    },
    onSuccess: (data) => {
      if (data.resetLink) setDevLink(data.resetLink);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Request failed')),
  });

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl relative overflow-hidden border border-gray-800">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
            <MailQuestion size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{t('forgotPassword.title')}</h2>
          <p className="text-gray-400 text-xs mt-1">{t('forgotPassword.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        {forgotM.isSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
              {t('forgotPassword.success')}
            </div>
            {devLink && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2.5 rounded-lg text-xxs font-mono break-all">
                {t('forgotPassword.devHint')} <Link to={devLink} className="underline">{devLink}</Link>
              </div>
            )}
            <div className="text-center">
              <Link to="/login" className="text-xxs text-gray-500 hover:text-blue-400 transition-all">
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              forgotM.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('forgotPassword.emailLabel')}
              </label>
              <input
                type="email"
                className="inp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.io"
                required
              />
            </div>

            <button
              type="submit"
              disabled={forgotM.isPending}
              className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm text-white mt-6 disabled:opacity-40"
            >
              {forgotM.isPending ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
            </button>
            <div className="text-center mt-4">
              <Link to="/login" className="text-xxs text-gray-500 hover:text-blue-400 transition-all">
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
