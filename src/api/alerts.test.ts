import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from './client';
import { alertsApi, watchlistApi } from './alerts';

vi.mock('./client', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('alertsApi.list', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('passes filters through as query params and maps the paginated response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { success: true, data: [{ id: 'a1' }], meta: { page: 2, limit: 5, total: 14 } },
    });

    const page = await alertsApi.list({ severity: 'high', acknowledged: false, page: 2, limit: 5 });

    expect(apiClient.get).toHaveBeenCalledWith('/v1/alerts', {
      params: { page: 2, limit: 5, severity: 'high', acknowledged: 'false' },
    });
    expect(page).toEqual({ items: [{ id: 'a1' }], page: 2, limit: 5, total: 14 });
  });

  it('falls back to demo data when the request fails, without throwing', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network down'));

    const page = await alertsApi.list();

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.total).toBe(page.items.length);
  });

  it('derives meta from the response when the backend omits it', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: [{ id: 'x' }, { id: 'y' }] } });

    const page = await alertsApi.list({ page: 1, limit: 20 });

    expect(page).toEqual({ items: [{ id: 'x' }, { id: 'y' }], page: 1, limit: 20, total: 2 });
  });
});

describe('watchlistApi.add', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('propagates a 409 duplicate error to the caller instead of swallowing it', async () => {
    const conflict = { isAxiosError: true, response: { status: 409, data: { error: { message: 'resource already exists' } } } };
    vi.mocked(apiClient.post).mockRejectedValue(conflict);

    await expect(watchlistApi.add({ entity_id: 'ent-009', note: 'dup' })).rejects.toBe(conflict);
  });
});
