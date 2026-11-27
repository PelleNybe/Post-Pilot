import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';
import { DribbbleProvider } from './dribbble.provider';

jest.mock('@postpilot/helpers/utils/ssrf-validator', () => ({
  validateUrlForSSRF: jest.fn().mockResolvedValue(undefined),
}));

describe('DribbbleProvider', () => {
  let provider: DribbbleProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new DribbbleProvider();
  });

  it('returns empty AuthTokenDetails from refreshToken to trigger reconnect', async () => {
    const res = await provider.refreshToken('old-token');
    expect(res.accessToken).toBe('');
    expect(res.refreshToken).toBe('');
    expect(res.expiresIn).toBe(0);
  });

  it('rejects posts without an image attachment', async () => {
    await expect(
      provider.post('id-1', 'tok', [{ id: 'p1', message: 'hi', media: [], settings: { title: 't' } } as any])
    ).rejects.toThrow('Dribbble requires an image attachment.');
  });

  it('validates mediaPath against SSRF before fetching image', async () => {
    (validateUrlForSSRF as jest.Mock).mockRejectedValueOnce(new Error('SSRF blocked'));

    await expect(
      provider.post('id-1', 'tok', [
        {
          id: 'p1',
          message: 'hi',
          media: [{ path: 'http://127.0.0.1/secret.png' }],
          settings: { title: 't' },
        } as any,
      ])
    ).rejects.toThrow('SSRF blocked');
    expect(validateUrlForSSRF).toHaveBeenCalledWith('http://127.0.0.1/secret.png');
  });
});
