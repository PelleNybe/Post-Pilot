import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsController } from './integrations.controller';
import { IntegrationManager } from '@postpilot/nestjs-libraries/integrations/integration.manager';
import { IntegrationService } from '@postpilot/nestjs-libraries/database/prisma/integrations/integration.service';
import { PostsService } from '@postpilot/nestjs-libraries/database/prisma/posts/posts.service';
import { RefreshIntegrationService } from '@postpilot/nestjs-libraries/integrations/refresh.integration.service';

describe('IntegrationsController', () => {
  let controller: IntegrationsController;
  const mockIntegrationManager = {
    getSocialIntegration: jest.fn(),
  };
  const mockIntegrationService = {
    getIntegrationsList: jest.fn(),
    getIntegrationById: jest.fn(),
    refreshNeeded: jest.fn(),
  };
  const mockPostsService = {};
  const mockRefreshIntegrationService = {
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        { provide: IntegrationManager, useValue: mockIntegrationManager },
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: PostsService, useValue: mockPostsService },
        {
          provide: RefreshIntegrationService,
          useValue: mockRefreshIntegrationService,
        },
      ],
    }).compile();

    controller = module.get(IntegrationsController);
  });

  it('blocks disallowed method invocation in functionIntegration', async () => {
    class DummyProvider {
      post = jest.fn();
      pages = jest.fn();
    }
    mockIntegrationService.getIntegrationById.mockResolvedValue({
      id: 'int-1',
      providerIdentifier: 'facebook',
      token: 'tok',
      internalId: 'ext-1',
    });
    mockIntegrationManager.getSocialIntegration.mockReturnValue(
      new DummyProvider()
    );

    await expect(
      controller.functionIntegration(
        { id: 'org-1' } as any,
        { id: 'int-1', name: 'post', data: {} } as any
      )
    ).rejects.toThrow('Function not found');
  });

  it('allows allowlisted UI helper method in functionIntegration', async () => {
    class DummyProvider {
      async pages(token: string) {
        return [{ id: 'p1', token }];
      }
    }
    mockIntegrationService.getIntegrationById.mockResolvedValue({
      id: 'int-1',
      providerIdentifier: 'facebook',
      token: 'tok',
      internalId: 'ext-1',
    });
    mockIntegrationManager.getSocialIntegration.mockReturnValue(
      new DummyProvider()
    );

    const res = await controller.functionIntegration(
      { id: 'org-1' } as any,
      { id: 'int-1', name: 'pages', data: {} } as any
    );

    expect(res).toEqual([{ id: 'p1', token: 'tok' }]);
  });

  it('reports health statuses accurately in healthCheck', async () => {
    mockIntegrationService.getIntegrationsList.mockResolvedValue([
      { id: '1', providerIdentifier: 'x', disabled: false, refreshNeeded: false },
      { id: '2', providerIdentifier: 'x', disabled: true, refreshNeeded: false },
      {
        id: '3',
        providerIdentifier: 'x',
        disabled: false,
        refreshNeeded: false,
        tokenExpiration: new Date(Date.now() - 10000).toISOString(),
        refreshToken: '',
      },
    ]);
    mockIntegrationManager.getSocialIntegration.mockReturnValue({});

    const res = await controller.healthCheck({ id: 'org-1' } as any);

    expect(res.results).toEqual([
      { id: '1', status: 'ok' },
      { id: '2', status: 'disabled' },
      { id: '3', status: 'refresh_needed' },
    ]);
    expect(mockIntegrationService.refreshNeeded).toHaveBeenCalledWith('org-1', '3');
  });
});
