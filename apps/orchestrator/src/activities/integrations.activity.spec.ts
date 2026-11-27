import { IntegrationsActivity } from './integrations.activity';

describe('IntegrationsActivity', () => {
  const integrationService = {
    getIntegrationById: jest.fn(),
  };
  const refreshIntegrationService = {
    refresh: jest.fn(),
  };

  let activity: IntegrationsActivity;

  beforeEach(() => {
    jest.clearAllMocks();
    activity = new IntegrationsActivity(
      integrationService as any,
      refreshIntegrationService as any
    );
  });

  it('delegates getIntegrationsById to IntegrationService with (orgId, id)', async () => {
    const fakeIntegration = { id: 'int-1', organizationId: 'org-1' };
    integrationService.getIntegrationById.mockResolvedValue(fakeIntegration);

    const result = await activity.getIntegrationsById('int-1', 'org-1');

    expect(integrationService.getIntegrationById).toHaveBeenCalledWith('org-1', 'int-1');
    expect(result).toBe(fakeIntegration);
  });

  it('delegates refreshToken to RefreshIntegrationService.refresh', async () => {
    const fakeIntegration = { id: 'int-1' } as any;
    const refreshed = { accessToken: 'new-token' };
    refreshIntegrationService.refresh.mockResolvedValue(refreshed);

    const result = await activity.refreshToken(fakeIntegration);

    expect(refreshIntegrationService.refresh).toHaveBeenCalledWith(fakeIntegration);
    expect(result).toBe(refreshed);
  });
});
