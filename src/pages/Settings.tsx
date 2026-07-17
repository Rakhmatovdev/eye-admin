import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  Mail,
  BadgeCheck,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import axios from 'axios';
import { authApi, mfaApi, type MFAEnrollment } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || err.message || fallback;
  }
  return fallback;
}

// Small "select-all on click" text block for the enrollment secret / otpauth
// URL — no QR/clipboard library, just a monospace box the admin can copy
// from manually (or via the native Clipboard API on click).
function SelectableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API unavailable — selection still works */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xxs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xxs text-gray-500 hover:text-blue-400 transition-all"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>
      <div
        onClick={(e) => {
          const range = document.createRange();
          range.selectNodeContents(e.currentTarget);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }}
        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-blue-300 font-mono break-all cursor-text select-all"
      >
        {value}
      </div>
    </div>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      className="inp tracking-[0.5em] text-center font-mono"
    />
  );
}

export const Settings: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const storedUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const meQ = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getProfile,
    initialData: storedUser ?? undefined,
  });

  const mfaEnabled = !!meQ.data?.mfaEnabled;

  const [enrollment, setEnrollment] = useState<MFAEnrollment | null>(null);
  const [otp, setOtp] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');

  const resetMfaFeedback = () => {
    setMfaError('');
    setMfaSuccess('');
  };

  const enrollM = useMutation({
    mutationFn: mfaApi.enroll,
    onMutate: resetMfaFeedback,
    onSuccess: (data) => setEnrollment(data),
    onError: (err) => setMfaError(apiErrorMessage(err, 'Failed to start MFA enrollment.')),
  });

  const verifyM = useMutation({
    mutationFn: (code: string) => mfaApi.verify(code),
    onMutate: resetMfaFeedback,
    onSuccess: () => {
      setMfaSuccess('MFA enabled. You will be asked for a code on your next login.');
      setEnrollment(null);
      setOtp('');
      updateUser({ mfaEnabled: true });
      queryClient.setQueryData(['auth', 'me'], (prev: typeof meQ.data) =>
        prev ? { ...prev, mfaEnabled: true } : prev
      );
    },
    onError: (err) => setMfaError(apiErrorMessage(err, 'Invalid verification code.')),
  });

  const disableM = useMutation({
    mutationFn: (code: string) => mfaApi.disable(code),
    onMutate: resetMfaFeedback,
    onSuccess: () => {
      setMfaSuccess('MFA disabled for your account.');
      setOtp('');
      updateUser({ mfaEnabled: false });
      queryClient.setQueryData(['auth', 'me'], (prev: typeof meQ.data) =>
        prev ? { ...prev, mfaEnabled: false } : prev
      );
    },
    onError: (err) => setMfaError(apiErrorMessage(err, 'Invalid verification code.')),
  });

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const changePasswordM = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onMutate: () => setPwError(''),
    onSuccess: () => {
      setPwSuccess(true);
      // Backend revokes all refresh tokens on password change — force a
      // fresh login rather than leaving a now-dead session hanging around.
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1800);
    },
    onError: (err) => setPwError(apiErrorMessage(err, 'Failed to change password.')),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{t('settings.title')}</h1>
        <p className="text-gray-400 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Account */}
      <div className="glass p-6 rounded-2xl border border-gray-800 space-y-4">
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <UserIcon size={16} className="text-blue-400" /> {t('settings.account')}
        </h2>
        {meQ.isLoading ? (
          <p className="text-xs text-gray-500">{t('common.loading')}</p>
        ) : meQ.data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-950/40 p-4 border border-gray-800/40 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400">
              <UserIcon size={12} className="text-gray-600" />
              <span>{t('settings.name')}: <span className="text-gray-200 font-medium">{meQ.data.name}</span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Mail size={12} className="text-gray-600" />
              <span>{t('settings.email')}: <span className="text-gray-200 font-medium">{meQ.data.email}</span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <BadgeCheck size={12} className="text-gray-600" />
              <span>{t('settings.role')}: <span className="text-gray-200 font-medium capitalize">{meQ.data.role}</span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck size={12} className="text-gray-600" />
              <span>{t('settings.clearance')}: <span className="text-gray-200 font-medium">{meQ.data.clearance}</span></span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-red-400">{t('common.error')}</p>
        )}
      </div>

      {/* MFA */}
      <div className="glass p-6 rounded-2xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <KeyRound size={16} className="text-blue-400" /> {t('settings.mfa')}
          </h2>
          <span
            className={`inline-flex items-center gap-1 text-xxs font-bold px-2.5 py-0.5 rounded-full border ${
              mfaEnabled
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}
          >
            {mfaEnabled ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
            {mfaEnabled ? t('settings.mfaEnabled') : t('settings.mfaDisabled')}
          </span>
        </div>

        {mfaError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
            {mfaError}
          </div>
        )}
        {mfaSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
            {mfaSuccess}
          </div>
        )}

        {mfaEnabled ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">{t('settings.mfaDisableDesc')}</p>
            <div className="max-w-[200px]">
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            <button
              onClick={() => disableM.mutate(otp)}
              disabled={otp.length !== 6 || disableM.isPending}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all"
            >
              {disableM.isPending ? `${t('common.loading')}` : t('settings.disableMfa')}
            </button>
          </div>
        ) : enrollment ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">{t('settings.mfaEnrolledDesc')}</p>
            <SelectableField label={t('settings.secret')} value={enrollment.secret} />
            <SelectableField label={t('settings.otpauthUrl')} value={enrollment.otpauthUrl} />
            <div className="max-w-[200px]">
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => verifyM.mutate(otp)}
                disabled={otp.length !== 6 || verifyM.isPending}
                className="btn-primary px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all"
              >
                {verifyM.isPending ? t('common.loading') : t('settings.verifyEnable')}
              </button>
              <button
                onClick={() => {
                  setEnrollment(null);
                  setOtp('');
                  resetMfaFeedback();
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-300 rounded-lg text-xs font-semibold transition-all"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">{t('settings.mfaEnableDesc')}</p>
            <button
              onClick={() => enrollM.mutate()}
              disabled={enrollM.isPending}
              className="btn-primary px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all"
            >
              {enrollM.isPending ? t('common.loading') : t('settings.enableMfa')}
            </button>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="glass p-6 rounded-2xl border border-gray-800 space-y-4">
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <Lock size={16} className="text-blue-400" /> {t('settings.changePassword')}
        </h2>
        <p className="text-xs text-gray-500">{t('settings.changePasswordDesc')}</p>

        {pwError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
            {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
            {t('settings.changePasswordSuccess')}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            changePasswordM.mutate();
          }}
          className="space-y-3 max-w-sm"
        >
          <div>
            <label className="block text-xxs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t('settings.currentPassword')}
            </label>
            <input
              type="password"
              className="inp"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={pwSuccess}
            />
          </div>
          <div>
            <label className="block text-xxs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t('settings.newPassword')}
            </label>
            <input
              type="password"
              className="inp"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
              disabled={pwSuccess}
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordM.isPending || pwSuccess || !currentPassword || newPassword.length < 6}
            className="btn-primary px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all"
          >
            {changePasswordM.isPending ? t('common.loading') : t('settings.changePasswordSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
};
