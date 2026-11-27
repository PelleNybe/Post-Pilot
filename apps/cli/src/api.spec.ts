jest.mock('node-fetch', () => {
  const fetchFn = jest.fn();
  class FormData {
    entries: Array<[string, unknown, unknown]> = [];
    append(key: string, val: unknown, filename?: unknown) {
      this.entries.push([key, val, filename]);
    }
  }
  return {
    __esModule: true,
    default: fetchFn,
    FormData,
  };
});

import fetch from 'node-fetch';
import { PostPilotAPI } from './api';

const mockFetch = fetch as unknown as jest.Mock;

describe('PostPilotAPI (CLI)', () => {
  const originalEnv = process.env.POSTPILOT_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.POSTPILOT_API_URL;
  });

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env.POSTPILOT_API_URL = originalEnv;
    } else {
      delete process.env.POSTPILOT_API_URL;
    }
  });

  it('defaults to http://localhost:3000 and respects POSTPILOT_API_URL env var', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });

    const defaultApi = new PostPilotAPI({ apiKey: 'cli-key' });
    await defaultApi.listIntegrations();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/public/v1/integrations',
      expect.any(Object)
    );

    process.env.POSTPILOT_API_URL = 'https://custom.postpilot.test';
    const envApi = new PostPilotAPI({ apiKey: 'cli-key' });
    await envApi.listIntegrations();
    expect(mockFetch).toHaveBeenLastCalledWith(
      'https://custom.postpilot.test/public/v1/integrations',
      expect.any(Object)
    );
  });

  it('throws descriptive error when API responds with non-ok status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'),
    });

    const api = new PostPilotAPI({ apiKey: 'bad-key', apiUrl: 'http://localhost:3000' });
    await expect(api.listPosts({ state: 'QUEUE' })).rejects.toThrow(
      'Request failed: API Error (401): Unauthorized'
    );
  });

  it('builds multipart upload request with MIME type mapping', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'file-1', path: '/uploads/pic.png' }),
    });

    const api = new PostPilotAPI({ apiKey: 'cli-key' });
    const res = await api.upload(Buffer.from('pngdata'), 'pic.png');

    expect(res).toEqual({ id: 'file-1', path: '/uploads/pic.png' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/public/v1/upload',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'cli-key' },
      })
    );
  });

  it('calls integration settings and trigger tool endpoints', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const api = new PostPilotAPI({ apiKey: 'cli-key' });
    await api.getIntegrationSettings('int-9');
    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://localhost:3000/public/v1/integration-settings/int-9',
      expect.objectContaining({ method: 'GET' })
    );

    await api.triggerIntegrationTool('int-9', 'boards', { query: 'news' });
    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://localhost:3000/public/v1/integration-trigger/int-9',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ methodName: 'boards', data: { query: 'news' } }),
      })
    );
  });
});
