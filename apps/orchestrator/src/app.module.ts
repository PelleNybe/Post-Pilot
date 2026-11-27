import { Module } from '@nestjs/common';
import { PostActivity } from '@postpilot/orchestrator/activities/post.activity';
import { getTemporalModule } from '@postpilot/nestjs-libraries/temporal/temporal.module';
import { DatabaseModule } from '@postpilot/nestjs-libraries/database/prisma/database.module';
import { AutopostActivity } from '@postpilot/orchestrator/activities/autopost.activity';
import { EmailActivity } from '@postpilot/orchestrator/activities/email.activity';
import { IntegrationsActivity } from '@postpilot/orchestrator/activities/integrations.activity';

const activities = [
  PostActivity,
  AutopostActivity,
  EmailActivity,
  IntegrationsActivity,
];
@Module({
  imports: [
    DatabaseModule,
    getTemporalModule(true, require.resolve('./workflows'), activities),
  ],
  controllers: [],
  providers: [...activities],
  get exports() {
    return [...this.providers, ...this.imports];
  },
})
export class AppModule {}
