import { Global, Module } from '@nestjs/common';
import { PrismaRepository, PrismaService, PrismaTransaction } from './prisma.service';
import { OrganizationRepository } from '@postpilot/nestjs-libraries/database/prisma/organizations/organization.repository';
import { OrganizationService } from '@postpilot/nestjs-libraries/database/prisma/organizations/organization.service';
import { UsersService } from '@postpilot/nestjs-libraries/database/prisma/users/users.service';
import { UsersRepository } from '@postpilot/nestjs-libraries/database/prisma/users/users.repository';
import { SubscriptionService } from '@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { SubscriptionRepository } from '@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.repository';
import { NotificationService } from '@postpilot/nestjs-libraries/database/prisma/notifications/notification.service';
import { IntegrationService } from '@postpilot/nestjs-libraries/database/prisma/integrations/integration.service';
import { IntegrationRepository } from '@postpilot/nestjs-libraries/database/prisma/integrations/integration.repository';
import { PostsService } from '@postpilot/nestjs-libraries/database/prisma/posts/posts.service';
import { PostsRepository } from '@postpilot/nestjs-libraries/database/prisma/posts/posts.repository';
import { IntegrationManager } from '@postpilot/nestjs-libraries/integrations/integration.manager';
import { MediaService } from '@postpilot/nestjs-libraries/database/prisma/media/media.service';
import { MediaRepository } from '@postpilot/nestjs-libraries/database/prisma/media/media.repository';
import { NotificationsRepository } from '@postpilot/nestjs-libraries/database/prisma/notifications/notifications.repository';
import { EmailService } from '@postpilot/nestjs-libraries/services/email.service';
import { StripeService } from '@postpilot/nestjs-libraries/services/stripe.service';
import { ExtractContentService } from '@postpilot/nestjs-libraries/openai/extract.content.service';
import { OpenaiService } from '@postpilot/nestjs-libraries/openai/openai.service';
import { AgenciesService } from '@postpilot/nestjs-libraries/database/prisma/agencies/agencies.service';
import { AgenciesRepository } from '@postpilot/nestjs-libraries/database/prisma/agencies/agencies.repository';
import { TrackService } from '@postpilot/nestjs-libraries/track/track.service';
import { ShortLinkService } from '@postpilot/nestjs-libraries/short-linking/short.link.service';
import { WebhooksRepository } from '@postpilot/nestjs-libraries/database/prisma/webhooks/webhooks.repository';
import { WebhooksService } from '@postpilot/nestjs-libraries/database/prisma/webhooks/webhooks.service';
import { SignatureRepository } from '@postpilot/nestjs-libraries/database/prisma/signatures/signature.repository';
import { SignatureService } from '@postpilot/nestjs-libraries/database/prisma/signatures/signature.service';
import { AutopostRepository } from '@postpilot/nestjs-libraries/database/prisma/autopost/autopost.repository';
import { AutopostService } from '@postpilot/nestjs-libraries/database/prisma/autopost/autopost.service';
import { SetsService } from '@postpilot/nestjs-libraries/database/prisma/sets/sets.service';
import { SetsRepository } from '@postpilot/nestjs-libraries/database/prisma/sets/sets.repository';
import { ThirdPartyRepository } from '@postpilot/nestjs-libraries/database/prisma/third-party/third-party.repository';
import { ThirdPartyService } from '@postpilot/nestjs-libraries/database/prisma/third-party/third-party.service';
import { VideoManager } from '@postpilot/nestjs-libraries/videos/video.manager';
import { FalService } from '@postpilot/nestjs-libraries/openai/fal.service';
import { RefreshIntegrationService } from '@postpilot/nestjs-libraries/integrations/refresh.integration.service';
import { OAuthRepository } from '@postpilot/nestjs-libraries/database/prisma/oauth/oauth.repository';
import { OAuthService } from '@postpilot/nestjs-libraries/database/prisma/oauth/oauth.service';
import { ProductsRepository } from '@postpilot/nestjs-libraries/database/prisma/products/products.repository';
import { ProductsService } from '@postpilot/nestjs-libraries/database/prisma/products/products.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    PrismaService,
    PrismaRepository,
    PrismaTransaction,
    UsersService,
    UsersRepository,
    OrganizationService,
    OrganizationRepository,
    SubscriptionService,
    SubscriptionRepository,
    NotificationService,
    NotificationsRepository,
    WebhooksRepository,
    WebhooksService,
    IntegrationService,
    IntegrationRepository,
    PostsService,
    PostsRepository,
    StripeService,
    SignatureRepository,
    AutopostRepository,
    AutopostService,
    SignatureService,
    MediaService,
    MediaRepository,
    AgenciesService,
    AgenciesRepository,
    IntegrationManager,
    RefreshIntegrationService,
    ExtractContentService,
    OpenaiService,
    FalService,
    EmailService,
    TrackService,
    ShortLinkService,
    SetsService,
    SetsRepository,
    ThirdPartyRepository,
    ThirdPartyService,
    OAuthRepository,
    OAuthService,
    ProductsRepository,
    ProductsService,
    VideoManager,
  ],
  get exports() {
    return this.providers;
  },
})
export class DatabaseModule {}
