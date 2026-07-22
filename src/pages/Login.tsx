import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import axios from 'axios';
import { useT } from '../hooks/useT';
import { LocaleSwitcher } from '../components/ui/LocaleSwitcher';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const t = useT();

  const [email, setEmail] = useState('admin@platform.io');
  const [password, setPassword] = useState('Admin123!');
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authApi.login({ email, password });
      if (result.mfaRequired) {
        // Account has MFA enabled — switch to the OTP form and re-send the
        // login request with `otp` once the user submits it.
        setMfaStep(true);
        setIsLoading(false);
        return;
      }
      if (result.user && result.token) {
        login(result.user, result.token, result.refreshToken);
        navigate('/dashboard');
      } else {
        setError('Authentication failed');
        setIsLoading(false);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error?.message || err.message
        : 'Invalid email or password';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authApi.login({ email, password, otp: mfaCode });
      if (result.user && result.token) {
        login(result.user, result.token, result.refreshToken);
        navigate('/dashboard');
      } else {
        setError('Verification failed');
        setIsLoading(false);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error?.message || err.message
        : 'Invalid verification code';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl relative overflow-hidden border border-gray-800">
        {/* Glow effect on top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
            <ShieldAlert size={24} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{t('login.heading')}</h2>
          <p className="text-gray-400 text-xs mt-1">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        {!mfaStep ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('login.email')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="admin@platform.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? t('login.submitting') : t('login.submit')}
              <ArrowRight size={16} />
            </button>
            <div className="text-center mt-3">
              <Link to="/forgot-password" className="text-xxs text-gray-500 hover:text-blue-400 transition-all">
                {t('login.forgotLink')}
              </Link>
            </div>
            <div className="text-center mt-3">
              <span className="text-xxs text-gray-500">{t('login.demoUser')}</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-300">{t('login.mfaPrompt')}</p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                className="w-full py-3 tracking-[1.5em] text-center text-2xl font-bold bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 text-blue-400"
                placeholder="000000"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setMfaStep(false);
                  setMfaCode('');
                  setError('');
                }}
                className="flex-1 py-2.5 border border-gray-800 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800/30 transition-all"
              >
                {t('common.back')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary py-2.5 rounded-lg font-semibold text-sm text-white"
              >
                {isLoading ? t('login.mfaSubmitting') : t('login.mfaSubmit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
