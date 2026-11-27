import { BadBody, RefreshToken } from '@postpilot/nestjs-libraries/integrations/social.abstract';
import { SlackProvider } from './slack.provider';

describe('SlackProvider', () => {
  let provider: SlackProvider;

  beforeEach(() => {
    provider = new SlackProvider();
    jest.clearAllMocks();
  });

  it('throws RefreshToken when Slack API returns { ok: false, error: "invalid_auth" }', async () => {
    jest.spyOn(provider, 'fetch').mockImplementation(async (url: string) => {
      if (url.includes('conversations.join')) {
        return { json: async () => ({ ok: true }) } as any;
      }
      return {
        json: async () => ({ ok: false, error: 'invalid_auth' }),
      } as any;
    });

    await expect(
      provider.post(
        'int-1',
        'xoxb-tok',
        [{ id: 'p1', message: 'Hello Slack', settings: { channel: 'C123' } } as any],
        { name: 'Bot', picture: '' } as any
      )
    ).rejects.toThrow(RefreshToken);
  });

  it('throws BadBody on non-auth Slack API failure during comment', async () => {
    jest.spyOn(provider, 'fetch').mockResolvedValue({
      json: async () => ({ ok: false, error: 'channel_not_found' }),
    } as any);

    await expect(
      provider.comment(
        'int-1',
        '1700000000.000100',
        undefined,
        'xoxb-tok',
        [{ id: 'c1', message: 'Reply', settings: { channel: 'C999' } } as any],
        { name: 'Bot', picture: '' } as any
      )
    ).rejects.toThrow(BadBody);
  });
});
