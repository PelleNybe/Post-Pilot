import { Injectable } from '@nestjs/common';
import { AutopostService } from '@postpilot/nestjs-libraries/database/prisma/autopost/autopost.service';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Injectable()
@Activity()
export class AutopostActivity {
  constructor(private readonly _autoPostService: AutopostService) {}

  @ActivityMethod()
  async autoPost(id: string) {
    return this._autoPostService.startAutopost(id);
  }
}
