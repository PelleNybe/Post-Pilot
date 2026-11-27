import { SocialAbstract, RefreshToken, BadBody } from './social.abstract';

jest.mock('@postpilot/helpers/utils/ssrf-validator', () => ({
  validateUrlForSSRF: jest.fn().mockResolvedValue(undefined),
}));

class TestProvider extends SocialAbstract {
  identifier = 'test-provider';
  override maxConcurrentJob = 2;
}

describe('SocialAbstract', () => {
  let provider: TestProvider;

  beforeEach(() => {
    provider = new TestProvider();
    jest.clearAllMocks();
  });

  it('enforces maxConcurrentJob semaphore limit across parallel runInConcurrent calls', async () => {
    let active = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        provider.runInConcurrent(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((r) => setTimeout(r, 15));
          active -= 1;
          return i;
        })
      )
    );

    expect(peak).toBe(2);
  });

  it('bypasses semaphore limit when ignoreConcurrency is true', async () => {
    let active = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 4 }, () =>
        provider.runInConcurrent(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((r) => setTimeout(r, 15));
          active -= 1;
        }, true)
      )
    );

    expect(peak).toBe(4);
  });

  it('treats any 2xx status as success and throws RefreshToken on 401', async () => {
    const origFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ status: 204, text: jest.fn() } as any)
      .mockResolvedValueOnce({
        status: 401,
        text: jest.fn().mockResolvedValue('{"error":"expired"}'),
      } as any)
      .mockResolvedValueOnce({
        status: 400,
        text: jest.fn().mockResolvedValue('{"error":"bad"}'),
      } as any);

    const okRes = await provider.fetch('https://api.example.com/ok');
    expect(okRes.status).toBe(204);

    await expect(
      provider.fetch('https://api.example.com/unauth')
    ).rejects.toThrow(RefreshToken);

    await expect(
      provider.fetch('https://api.example.com/bad')
    ).rejects.toThrow(BadBody);

    global.fetch = origFetch;
  });
});
