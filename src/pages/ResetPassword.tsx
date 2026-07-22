import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
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

export const ResetPassword: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const resetM = useMutation({
    mutationFn: () => authApi.resetPassword(token, newPassword),
    onMutate: () => setError(''),
    onError: (err) => setError(apiErrorMessage(err, t('resetPassword.errorDefault'))),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.mismatch'));
      return;
    }
    resetM.mutate();
  };

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
            <KeyRound size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{t('resetPassword.title')}</h2>
          <p className="text-gray-400 text-xs mt-1">{t('resetPassword.subtitle')}</p>
        </div>

        {!token ? (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
              {t('resetPassword.missingToken')}
            </div>
            <div className="text-center">
              <Link to="/forgot-password" className="text-xxs text-gray-500 hover:text-blue-400 transition-all">
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>
        ) : resetM.isSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
              {t('resetPassword.success')}
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm text-white"
            >
              {t('resetPassword.loginLink')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('resetPassword.newPasswordLabel')}
              </label>
              <input
                type="password"
                className="inp"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('resetPassword.confirmPasswordLabel')}
              </label>
              <input
                type="password"
                className="inp"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={resetM.isPending || !newPassword || !confirmPassword}
              className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm text-white mt-6 disabled:opacity-40"
            >
              {resetM.isPending ? t('resetPassword.submitting') : t('resetPassword.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
