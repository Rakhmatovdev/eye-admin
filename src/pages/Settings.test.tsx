import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from './Settings';
import { authApi, mfaApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useLocaleStore } from '../store/localeStore';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../api/auth', () => ({
  authApi: { getProfile: vi.fn(), changePassword: vi.fn() },
  mfaApi: { enroll: vi.fn(), verify: vi.fn(), disable: vi.fn() },
}));

const storedUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@platform.io',
  role: 'admin' as const,
  clearance: 'SECRET' as const,
  mfaEnabled: false,
};

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </QueryClientProvider>
  );
  // The current/new password <label>s aren't associated with their <input>s
  // (no htmlFor/id, no wrapping) so getByLabelText can't find them — fall
  // back to DOM order within the change-password form instead.
  const getPasswordInputs = () =>
    Array.from(view.container.querySelectorAll<HTMLInputElement>('input[type="password"]'));
  return { ...view, getPasswordInputs };
}

describe('<Settings /> change password form', () => {
  beforeEach(() => {
    vi.mocked(authApi.getProfile).mockReset().mockResolvedValue(storedUser);
    vi.mocked(authApi.changePassword).mockReset();
    vi.mocked(mfaApi.enroll).mockReset();
    navigateMock.mockReset();
    // The app's default locale is 'uz' — force 'en' so the assertions below
    // can match on stable, readable English copy regardless of locale.
    useLocaleStore.setState({ locale: 'en' });
    useAuthStore.setState({
      user: storedUser,
      token: 'tok',
      refreshToken: 'rtok',
      isAuthenticated: true,
      isLoading: false,
      mfaRequired: false,
      mfaToken: null,
    });
  });

  it('keeps the submit button disabled until a current password and a >=6 char new password are entered', async () => {
    const user = userEvent.setup();
    const { getPasswordInputs } = renderSettings();

    const submit = await screen.findByRole('button', { name: /^change password$/i });
    expect(submit).toBeDisabled();

    const [current, next] = getPasswordInputs();
    await user.type(current, 'oldpass');
    expect(submit).toBeDisabled();

    await user.type(next, '123');
    expect(submit).toBeDisabled();

    await user.type(next, '456');
    expect(submit).toBeEnabled();
  });

  it('does not call authApi.changePassword while the new password is under 6 characters', async () => {
    const user = userEvent.setup();
    const { getPasswordInputs } = renderSettings();
    await screen.findByRole('button', { name: /^change password$/i });

    const [current, next] = getPasswordInputs();
    await user.type(current, 'oldpass');
    await user.type(next, '123');
    await user.click(screen.getByRole('button', { name: /^change password$/i }));

    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('submits the entered credentials to authApi.changePassword once validation passes', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.changePassword).mockResolvedValue(undefined);
    const { getPasswordInputs } = renderSettings();
    await screen.findByRole('button', { name: /^change password$/i });

    const [current, next] = getPasswordInputs();
    await user.type(current, 'oldpass');
    await user.type(next, 'newpass1');
    await user.click(screen.getByRole('button', { name: /^change password$/i }));

    await waitFor(() =>
      expect(authApi.changePassword).toHaveBeenCalledWith('oldpass', 'newpass1')
    );
    expect(await screen.findByText(/password changed/i)).toBeInTheDocument();
  });

  it('shows an error message when authApi.changePassword rejects', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.changePassword).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: 'Current password is incorrect' } } },
      message: 'Request failed with status 400',
    });
    const { getPasswordInputs } = renderSettings();
    await screen.findByRole('button', { name: /^change password$/i });

    const [current, next] = getPasswordInputs();
    await user.type(current, 'wrongpass');
    await user.type(next, 'newpass1');
    await user.click(screen.getByRole('button', { name: /^change password$/i }));

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
