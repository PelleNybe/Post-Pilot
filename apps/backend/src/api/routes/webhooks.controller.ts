import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GetOrgFromRequest } from '@postpilot/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from '@postpilot/nestjs-libraries/database/prisma/webhooks/webhooks.service';
import { CheckPolicies } from '@postpilot/backend/services/auth/permissions/permissions.ability';
import {
  UpdateDto,
  WebhooksDto,
} from '@postpilot/nestjs-libraries/dtos/webhooks/webhooks.dto';
import { AuthorizationActions, Sections } from '@postpilot/backend/services/auth/permissions/permission.exception.class';
import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';

@ApiTags('Webhooks')
@Controller('/webhooks')
export class WebhookController {
  constructor(private _webhooksService: WebhooksService) {}

  @Get('/')
  async getStatistics(@GetOrgFromRequest() org: Organization) {
    return this._webhooksService.getWebhooks(org.id);
  }

  @Post('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.WEBHOOKS])
  async createAWebhook(
    @GetOrgFromRequest() org: Organization,
    @Body() body: WebhooksDto
  ) {
    return this._webhooksService.createWebhook(org.id, body);
  }

  @Put('/')
  @CheckPolicies([AuthorizationActions.Update, Sections.WEBHOOKS])
  async updateWebhook(
    @GetOrgFromRequest() org: Organization,
    @Body() body: UpdateDto
  ) {
    return this._webhooksService.createWebhook(org.id, body);
  }

  @Delete('/:id')
  @CheckPolicies([AuthorizationActions.Delete, Sections.WEBHOOKS])
  async deleteWebhook(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._webhooksService.deleteWebhook(org.id, id);
  }

  @Post('/send')
  async sendWebhook(@Body() body: any, @Query('url') url: string) {
    try {
      await validateUrlForSSRF(url);
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      throw new BadRequestException('Invalid URL provided for webhook');
    }

    return { send: true };
  }
}
