import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Optional,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TemporalService } from 'nestjs-temporal-core';

@ApiTags('Monitor')
@Controller('/monitor')
export class MonitorController {
  constructor(@Optional() private readonly _temporalService?: TemporalService) {}

  @Get('/queue/:name')
  async getMessagesGroup(@Param('name') name: string) {
    const rawClient = this._temporalService?.client?.getRawClient?.();
    if (!rawClient) {
      throw new HttpException(
        { status: 'error', message: 'Temporal client unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      const response =
        await rawClient.connection.workflowService.describeTaskQueue({
          namespace: process.env.TEMPORAL_NAMESPACE || 'default',
          taskQueue: { name },
        });
      const pollers = response.pollers?.length || 0;
      if (pollers === 0) {
        throw new HttpException(
          {
            status: 'unhealthy',
            pollers,
            message: `Queue ${name} has no active pollers.`,
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      return {
        status: 'success',
        pollers,
        message: `Queue ${name} is healthy.`,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        {
          status: 'error',
          message: `Failed to inspect queue ${name}.`,
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
