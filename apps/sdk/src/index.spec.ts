jest.mock('node-fetch', () => {
  const fetchFn = jest.fn();
  class FormData {
    entries: Array<[string, unknown, unknown]> = [];
    append(key: string, val: unknown, meta?: unknown) {
      this.entries.push([key, val, meta]);
    }
  }
  return {
    __esModule: true,
    default: fetchFn,
    FormData,
  };
});

import fetch from 'node-fetch';
import PostPilot from './index';

const mockFetch = fetch as unknown as jest.Mock;

describe('PostPilot SDK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ ok: true }),
    });
  });

  it('defaults base URL to http://localhost:3000', async () => {
    const client = new PostPilot('secret-key');
    await client.integrations();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/public/v1/integrations',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'secret-key',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('supports custom base URL and serializes postList query params while skipping nullish keys', async () => {
    const client = new PostPilot('key-123', 'https://api.example.com');
    await client.postList({ page: 2, customer: undefined, startDate: '2026-01-01' } as any);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/public/v1/posts?page=2&startDate=2026-01-01',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('dispatches create post, upload, and deletePost requests properly', async () => {
    const client = new PostPilot('key-123');
    const payload = { type: 'now', posts: [] } as any;

    await client.post(payload);
    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://localhost:3000/public/v1/posts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    await client.upload(Buffer.from('abc'), 'png');
    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://localhost:3000/public/v1/upload',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'key-123' },
      })
    );

    await client.deletePost('post-42');
    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://localhost:3000/public/v1/posts/post-42',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
