import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@postpilot/nestjs-libraries/user/org.from.request';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationService } from '@postpilot/nestjs-libraries/database/prisma/integrations/integration.service';
import { PostsService } from '@postpilot/nestjs-libraries/database/prisma/posts/posts.service';

@ApiTags('Analytics')
@Controller('/analytics')
export class AnalyticsController {
  constructor(
    private _integrationService: IntegrationService,
    private _postsService: PostsService
  ) {}

  @Get('/overview')
  async getOverview(@GetOrgFromRequest() org: Organization) {
    return this._postsService.getOrganizationOverview(org.id);
  }

  @Get('/:integration')
  async getIntegration(
    @GetOrgFromRequest() org: Organization,
    @Param('integration') integration: string,
    @Query('date') date: string
  ) {
    return this._integrationService.checkAnalytics(org, integration, date);
  }

  @Get('/post/:postId')
  async getPostAnalytics(
    @GetOrgFromRequest() org: Organization,
    @Param('postId') postId: string,
    @Query('date') date: string
  ) {
    return this._postsService.checkPostAnalytics(org.id, postId, +date);
  }

  @Get('/:integration/export')
  async exportIntegrationAnalytics(
    @GetOrgFromRequest() org: Organization,
    @Param('integration') integration: string,
    @Query('date') date: string,
    @Res() res: any
  ) {
    const data = await this._integrationService.checkAnalytics(org, integration, date);
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).send('No data available');
    }

    const escapeCsv = (value: unknown): string => {
      const str =
        value === null || value === undefined
          ? ''
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = ['label', 'percentageChange', 'date', 'total'];
    const rows: string[] = [];
    for (const metric of data) {
      const points = Array.isArray(metric?.data) && metric.data.length
        ? metric.data
        : [{ date: '', total: '' }];
      for (const point of points) {
        rows.push(
          [
            escapeCsv(metric?.label),
            escapeCsv(metric?.percentageChange),
            escapeCsv(point?.date),
            escapeCsv(point?.total),
          ].join(',')
        );
      }
    }
    const csv = [headers.join(','), ...rows].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`analytics_${integration}_${date}.csv`);
    return res.send(csv);
  }

}
