import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import apiClient, { isAuthEndpoint } from './client';
import { useAuthStore } from '../store/authStore';

// Reach into axios's InterceptorManager internals (a plain `{handlers: []}`
// array — see node_modules/axios/lib/core/InterceptorManager.js) to grab the
// functions registered by client.ts, since they aren't exported directly.
const requestHandler = () => (apiClient.interceptors.request as any).handlers[0];
const responseHandler = () => (apiClient.interceptors.response as any).handlers[0];

function makeAxiosError(status: number, config: Record<string, unknown>) {
  return {
    isAxiosError: true,
    response: { status, data: {} },
    config,
    message: `Request failed with status ${status}`,
  };
}

describe('isAuthEndpoint', () => {
  it('is true for the login and refresh endpoints', () => {
    expect(isAuthEndpoint('/v1/auth/login')).toBe(true);
    expect(isAuthEndpoint('http://localhost:8080/api/v1/auth/refresh')).toBe(true);
  });

  it('is false for other endpoints and for an undefined url', () => {
    expect(isAuthEndpoint('/v1/users/me')).toBe(false);
    expect(isAuthEndpoint('/v1/auth/mfa/verify')).toBe(false);
    expect(isAuthEndpoint(undefined)).toBe(false);
  });
});

describe('apiClient request interceptor', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  });

  it('attaches an Authorization header from the auth store when a token is present, omits it otherwise', async () => {
    useAuthStore.setState({ token: 'abc123' });
    const withToken = await requestHandler().fulfilled({ headers: {} } as any);
    expect(withToken.headers.Authorization).toBe('Bearer abc123');

    useAuthStore.setState({ token: null });
    const withoutToken = await requestHandler().fulfilled({ headers: {} } as any);
    expect(withoutToken.headers.Authorization).toBeUndefined();
  });
});

describe('apiClient response interceptor (401 refresh/retry)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'old-token',
      refreshToken: 'refresh-token',
      user: { id: '1', name: 'A', email: 'a@a.io', role: 'admin', clearance: 'SECRET' } as any,
      isAuthenticated: true,
    });
    apiClient.defaults.adapter = vi.fn().mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes non-401 errors through unchanged', async () => {
    const error = makeAxiosError(500, { url: '/v1/users', headers: {} });
    await expect(responseHandler().rejected(error)).rejects.toBe(error);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logs out without attempting a refresh when the 401 comes from the login endpoint itself', async () => {
    const postSpy = vi.spyOn(axios, 'post');
    const error = makeAxiosError(401, { url: '/v1/auth/login', headers: {} });

    await expect(responseHandler().rejected(error)).rejects.toBe(error);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('logs out without retrying again when the request has already been retried once', async () => {
    const postSpy = vi.spyOn(axios, 'post');
    const error = makeAxiosError(401, { url: '/v1/widgets', headers: {}, _retry: true });

    await expect(responseHandler().rejected(error)).rejects.toBe(error);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('silently refreshes the token and retries the original request once on a 401', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { data: { access_token: 'new-token', refresh_token: 'new-refresh' } },
    } as any);
    const originalRequest = { url: '/v1/widgets', headers: {} };
    const error = makeAxiosError(401, originalRequest);

    const result = await responseHandler().rejected(error);

    expect(result.data).toEqual({ ok: true });
    expect(originalRequest.headers).toMatchObject({ Authorization: 'Bearer new-token' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    // Runtime behaviour of the known setAccessToken(token, refreshToken) /
    // setAccessToken(token) signature mismatch: only the access token is
    // actually persisted, the rotated refresh token is dropped.
    expect(useAuthStore.getState().token).toBe('new-token');
  });

  it('logs out when the refresh call itself fails (e.g. no refresh token stored)', async () => {
    useAuthStore.setState({ refreshToken: null });
    const postSpy = vi.spyOn(axios, 'post');
    const error = makeAxiosError(401, { url: '/v1/widgets', headers: {} });

    await expect(responseHandler().rejected(error)).rejects.toBe(error);

    expect(postSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('single-flights concurrent 401s into a single refresh call', async () => {
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { data: { access_token: 'shared-token' } },
    } as any);

    const reqA = { url: '/v1/a', headers: {} };
    const reqB = { url: '/v1/b', headers: {} };

    const [resA, resB] = await Promise.all([
      responseHandler().rejected(makeAxiosError(401, reqA)),
      responseHandler().rejected(makeAxiosError(401, reqB)),
    ]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(resA.data).toEqual({ ok: true });
    expect(resB.data).toEqual({ ok: true });
    expect(reqA.headers).toMatchObject({ Authorization: 'Bearer shared-token' });
    expect(reqB.headers).toMatchObject({ Authorization: 'Bearer shared-token' });
  });
});
