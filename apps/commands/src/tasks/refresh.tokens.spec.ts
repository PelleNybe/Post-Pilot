import { RefreshTokens } from './refresh.tokens';

describe('RefreshTokens command', () => {
  it('invokes integrationService.refreshTokens and returns true', async () => {
    const integrationService = {
      refreshTokens: jest.fn().mockResolvedValue(undefined),
    };
    const cmd = new RefreshTokens(integrationService as any);

    const res = await cmd.refresh();

    expect(integrationService.refreshTokens).toHaveBeenCalledTimes(1);
    expect(res).toBe(true);
  });
});
