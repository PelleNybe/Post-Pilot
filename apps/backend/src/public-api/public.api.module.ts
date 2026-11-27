import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from '@postpilot/backend/services/auth/auth.service';
import { StripeService } from '@postpilot/nestjs-libraries/services/stripe.service';
import { PoliciesGuard } from '@postpilot/backend/services/auth/permissions/permissions.guard';
import { PermissionsService } from '@postpilot/backend/services/auth/permissions/permissions.service';
import { IntegrationManager } from '@postpilot/nestjs-libraries/integrations/integration.manager';
import { UploadModule } from '@postpilot/nestjs-libraries/upload/upload.module';
import { OpenaiService } from '@postpilot/nestjs-libraries/openai/openai.service';
import { ExtractContentService } from '@postpilot/nestjs-libraries/openai/extract.content.service';
import { CodesService } from '@postpilot/nestjs-libraries/services/codes.service';
import { PublicIntegrationsController } from '@postpilot/backend/public-api/routes/v1/public.integrations.controller';
import { PublicAuthMiddleware } from '@postpilot/backend/services/auth/public.auth.middleware';

const authenticatedController = [PublicIntegrationsController];
@Module({
  imports: [UploadModule],
  controllers: [...authenticatedController],
  providers: [
    AuthService,
    StripeService,
    OpenaiService,
    ExtractContentService,
    PoliciesGuard,
    PermissionsService,
    CodesService,
    IntegrationManager,
  ],
  get exports() {
    return [...this.imports, ...this.providers];
  },
})
export class PublicApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PublicAuthMiddleware).forRoutes(...authenticatedController);
  }
}

