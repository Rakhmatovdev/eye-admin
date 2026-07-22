import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useLocaleStore } from '../store/localeStore';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../api/auth', () => ({
  authApi: { login: vi.fn() },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('<Login />', () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset();
    navigateMock.mockReset();
    // The app's default locale is 'uz' — force 'en' so the assertions below
    // can match on stable, readable English copy regardless of locale.
    useLocaleStore.setState({ locale: 'en' });
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      mfaRequired: false,
      mfaToken: null,
    });
  });

  it('logs in and navigates to /dashboard when no MFA is required', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      mfaRequired: false,
      user: { id: '1', name: 'Admin', email: 'admin@platform.io', role: 'admin', clearance: 'SECRET' },
      token: 'access-tok',
      refreshToken: 'refresh-tok',
    });
    renderLogin();

    await user.click(screen.getByRole('button', { name: /authenticate/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('access-tok');
  });

  it('switches to the OTP form when authApi.login reports mfaRequired', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({ mfaRequired: true });
    renderLogin();

    expect(screen.queryByPlaceholderText('000000')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /authenticate/i }));

    expect(await screen.findByPlaceholderText('000000')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('submits the OTP form and completes login after MFA was required', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login)
      .mockResolvedValueOnce({ mfaRequired: true })
      .mockResolvedValueOnce({
        mfaRequired: false,
        user: { id: '1', name: 'Admin', email: 'admin@platform.io', role: 'admin', clearance: 'SECRET' },
        token: 'access-tok-2',
        refreshToken: 'refresh-tok-2',
      });
    renderLogin();

    await user.click(screen.getByRole('button', { name: /authenticate/i }));
    const otpInput = await screen.findByPlaceholderText('000000');
    await user.type(otpInput, '123456');
    await user.click(screen.getByRole('button', { name: /^authorize$/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'));
    expect(authApi.login).toHaveBeenLastCalledWith(
      expect.objectContaining({ otp: '123456' })
    );
  });

  it('shows an error message and does not navigate when login fails', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(new Error('boom'));
    renderLogin();

    await user.click(screen.getByRole('button', { name: /authenticate/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
