import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthController } from '@postpilot/backend/api/routes/auth.controller';
import { AuthService } from '@postpilot/backend/services/auth/auth.service';
import { UsersController } from '@postpilot/backend/api/routes/users.controller';
import { AuthMiddleware } from '@postpilot/backend/services/auth/auth.middleware';
import { StripeController } from '@postpilot/backend/api/routes/stripe.controller';
import { StripeService } from '@postpilot/nestjs-libraries/services/stripe.service';
import { AnalyticsController } from '@postpilot/backend/api/routes/analytics.controller';
import { PoliciesGuard } from '@postpilot/backend/services/auth/permissions/permissions.guard';
import { PermissionsService } from '@postpilot/backend/services/auth/permissions/permissions.service';
import { IntegrationsController } from '@postpilot/backend/api/routes/integrations.controller';
import { IntegrationManager } from '@postpilot/nestjs-libraries/integrations/integration.manager';
import { SettingsController } from '@postpilot/backend/api/routes/settings.controller';
import { PostsController } from '@postpilot/backend/api/routes/posts.controller';
import { MediaController } from '@postpilot/backend/api/routes/media.controller';
import { UploadModule } from '@postpilot/nestjs-libraries/upload/upload.module';
import { BillingController } from '@postpilot/backend/api/routes/billing.controller';
import { NotificationsController } from '@postpilot/backend/api/routes/notifications.controller';
import { OpenaiService } from '@postpilot/nestjs-libraries/openai/openai.service';
import { ExtractContentService } from '@postpilot/nestjs-libraries/openai/extract.content.service';
import { CodesService } from '@postpilot/nestjs-libraries/services/codes.service';
import { CopilotController } from '@postpilot/backend/api/routes/copilot.controller';
import { PublicController } from '@postpilot/backend/api/routes/public.controller';
import { RootController } from '@postpilot/backend/api/routes/root.controller';
import { TrackService } from '@postpilot/nestjs-libraries/track/track.service';
import { ShortLinkService } from '@postpilot/nestjs-libraries/short-linking/short.link.service';
import { Nowpayments } from '@postpilot/nestjs-libraries/crypto/nowpayments';
import { WebhookController } from '@postpilot/backend/api/routes/webhooks.controller';
import { SignatureController } from '@postpilot/backend/api/routes/signature.controller';
import { AutopostController } from '@postpilot/backend/api/routes/autopost.controller';
import { SetsController } from '@postpilot/backend/api/routes/sets.controller';
import { ThirdPartyController } from '@postpilot/backend/api/routes/third-party.controller';
import { MonitorController } from '@postpilot/backend/api/routes/monitor.controller';
import { NoAuthIntegrationsController } from '@postpilot/backend/api/routes/no.auth.integrations.controller';
import { EnterpriseController } from '@postpilot/backend/api/routes/enterprise.controller';
import { OAuthAppController } from '@postpilot/backend/api/routes/oauth-app.controller';
import { ApprovedAppsController } from '@postpilot/backend/api/routes/approved-apps.controller';
import { OAuthController, OAuthAuthorizedController } from '@postpilot/backend/api/routes/oauth.controller';
import { AuthProviderManager } from '@postpilot/backend/services/auth/providers/providers.manager';
import { GithubProvider } from '@postpilot/backend/services/auth/providers/github.provider';
import { GoogleProvider } from '@postpilot/backend/services/auth/providers/google.provider';
import { FarcasterProvider } from '@postpilot/backend/services/auth/providers/farcaster.provider';
import { WalletProvider } from '@postpilot/backend/services/auth/providers/wallet.provider';
import { OauthProvider } from '@postpilot/backend/services/auth/providers/oauth.provider';
import { ProductsController } from "@postpilot/backend/api/routes/products.controller";
import { ProductsService } from "@postpilot/nestjs-libraries/database/prisma/products/products.service";

const authenticatedController = [
  ProductsController,
  UsersController,
  AnalyticsController,
  IntegrationsController,
  SettingsController,
  PostsController,
  MediaController,
  BillingController,
  NotificationsController,
  CopilotController,
  WebhookController,
  SignatureController,
  AutopostController,
  SetsController,
  ThirdPartyController,
  OAuthAppController,
  ApprovedAppsController,
  OAuthAuthorizedController,
];
@Module({
  imports: [UploadModule],
  controllers: [
    RootController,
    StripeController,
    AuthController,
    PublicController,
    MonitorController,
    EnterpriseController,
    NoAuthIntegrationsController,
    OAuthController,
    ...authenticatedController,
  ],
  providers: [
    ProductsService,
    AuthService,
    StripeService,
    OpenaiService,
    ExtractContentService,
    AuthMiddleware,
    PoliciesGuard,
    PermissionsService,
    CodesService,
    IntegrationManager,
    TrackService,
    ShortLinkService,
    Nowpayments,
    AuthProviderManager,
    GithubProvider,
    GoogleProvider,
    FarcasterProvider,
    WalletProvider,
    OauthProvider,
  ],
  get exports() {
    return [...this.imports, ...this.providers];
  },
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(...authenticatedController);
  }
}
