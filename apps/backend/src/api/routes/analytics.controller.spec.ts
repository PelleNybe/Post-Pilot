import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { IntegrationService } from '@postpilot/nestjs-libraries/database/prisma/integrations/integration.service';
import { PostsService } from '@postpilot/nestjs-libraries/database/prisma/posts/posts.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  const mockIntegrationService = {
    checkAnalytics: jest.fn(),
  };
  const mockPostsService = {
    getOrganizationOverview: jest.fn(),
    checkPostAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: PostsService, useValue: mockPostsService },
      ],
    }).compile();

    controller = module.get(AnalyticsController);
  });

  it('delegates getOverview to PostsService.getOrganizationOverview', async () => {
    const overview = { totalPublished: 12, totalQueued: 4, activeChannels: 3 };
    mockPostsService.getOrganizationOverview.mockResolvedValue(overview);

    const res = await controller.getOverview({ id: 'org-1' } as any);

    expect(mockPostsService.getOrganizationOverview).toHaveBeenCalledWith('org-1');
    expect(res).toEqual(overview);
  });

  it('exports valid CSV rows with escaped quotes instead of [object Object]', async () => {
    mockIntegrationService.checkAnalytics.mockResolvedValue([
      {
        label: 'Impressions "Total"',
        percentageChange: 12.5,
        data: [{ date: '2026-01-01', total: 100 }],
      },
    ]);

    const res = {
      status: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      attachment: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await controller.exportIntegrationAnalytics(
      { id: 'org-1' } as any,
      'int-1',
      '30',
      res
    );

    expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.attachment).toHaveBeenCalledWith('analytics_int-1_30.csv');
    expect(res.send).toHaveBeenCalledWith(
      'label,percentageChange,date,total\n"Impressions ""Total""","12.5","2026-01-01","100"'
    );
  });

  it('returns 404 when export dataset is empty', async () => {
    mockIntegrationService.checkAnalytics.mockResolvedValue([]);
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await controller.exportIntegrationAnalytics(
      { id: 'org-1' } as any,
      'int-1',
      '7',
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('No data available');
  });
});
