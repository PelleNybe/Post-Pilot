import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { SubscriptionService } from '@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { PostsService } from '@postpilot/nestjs-libraries/database/prisma/posts/posts.service';
import { IntegrationService } from '@postpilot/nestjs-libraries/database/prisma/integrations/integration.service';
import { WebhooksService } from '@postpilot/nestjs-libraries/database/prisma/webhooks/webhooks.service';
import { AuthorizationActions, Sections } from './permission.exception.class';
import { pricing } from '@postpilot/nestjs-libraries/database/prisma/subscriptions/pricing';

// We mock the entire path to avoid Jest compiling problematic files
jest.mock('@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service');
jest.mock('@postpilot/nestjs-libraries/database/prisma/posts/posts.service');
jest.mock('@postpilot/nestjs-libraries/database/prisma/integrations/integration.service');
jest.mock('@postpilot/nestjs-libraries/database/prisma/webhooks/webhooks.service');

describe('PermissionsService', () => {
  let service: PermissionsService;
  let subscriptionService: SubscriptionService;
  let postsService: PostsService;
  let integrationService: IntegrationService;
  let webhooksService: WebhooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        SubscriptionService,
        PostsService,
        IntegrationService,
        WebhooksService
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    postsService = module.get<PostsService>(PostsService);
    integrationService = module.get<IntegrationService>(IntegrationService);
    webhooksService = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPackageOptions', () => {
    it('should return PRO options if no subscription is found (default behavior)', async () => {
      (subscriptionService.getSubscriptionByOrganizationId as jest.Mock).mockResolvedValue(null);

      const result = await service.getPackageOptions('org-1');

      expect(result.subscription).toBeNull();
      const { channel, ...all } = pricing.PRO;
      expect(result.options).toEqual({
        ...all,
        channel: -10,
      });
    });

    it('should return FREE options if subscription tier is FREE', async () => {
      const mockSubscription = { subscriptionTier: 'FREE' };
      (subscriptionService.getSubscriptionByOrganizationId as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.getPackageOptions('org-1');

      expect(result.subscription).toEqual(mockSubscription);
      const { channel, ...all } = pricing.FREE;
      expect(result.options).toEqual({
        ...all,
        channel,
      });
    });

    it('should return correct options if subscription tier is STANDARD', async () => {
      const mockSubscription = { subscriptionTier: 'STANDARD' };
      (subscriptionService.getSubscriptionByOrganizationId as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.getPackageOptions('org-1');

      expect(result.subscription).toEqual(mockSubscription);
      const { channel, ...all } = pricing.STANDARD;
      expect(result.options).toEqual({
        ...all,
        channel: -10,
      });
    });
  });

  describe('check', () => {
    it('should grant requested permissions when no check needed', async () => {
      const ability = await service.check('org-1', new Date(), 'USER', []);
      expect(ability.rules).toEqual([]);
    });

    it('should handle CHANNEL permission based on integration service', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, channel: 100 } as any,
      });

      (integrationService.getIntegrationsList as jest.Mock).mockResolvedValue([
        { refreshNeeded: false }, { refreshNeeded: false }, { refreshNeeded: false }, { refreshNeeded: false }, { refreshNeeded: false }
      ]);

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.CHANNEL]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.CHANNEL)).toBeTruthy();
    });

    it('should deny CHANNEL permission if total channels exceeds options', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, channel: 2 } as any,
      });

      (integrationService.getIntegrationsList as jest.Mock).mockResolvedValue([
        { refreshNeeded: false }, { refreshNeeded: false }, { refreshNeeded: false }, { refreshNeeded: false }, { refreshNeeded: false }
      ]);

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.CHANNEL]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.CHANNEL)).toBeFalsy();
    });

    it('should handle WEBHOOKS permission', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, webhooks: 50 } as any,
      });

      (webhooksService.getTotal as jest.Mock).mockResolvedValue(10);

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.WEBHOOKS]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.WEBHOOKS)).toBeTruthy();
    });

    it('should deny WEBHOOKS permission if total webhooks exceeds limit', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, webhooks: 5 } as any,
      });

      (webhooksService.getTotal as jest.Mock).mockResolvedValue(10);

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.WEBHOOKS]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.WEBHOOKS)).toBeFalsy();
    });

    it('should handle POSTS_PER_MONTH permission', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, posts_per_month: 1000 } as any,
      });

      (subscriptionService.getSubscriptionByOrganizationId as jest.Mock).mockResolvedValue(null);
      (postsService.countPostsFromDay as jest.Mock).mockResolvedValue(500);

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.POSTS_PER_MONTH]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.POSTS_PER_MONTH)).toBeTruthy();
    });

    it('should deny POSTS_PER_MONTH permission if limit exceeded', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, posts_per_month: 100 } as any,
      });

      (subscriptionService.getSubscriptionByOrganizationId as jest.Mock).mockResolvedValue(null);
      (postsService.countPostsFromDay as jest.Mock).mockResolvedValue(500);

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.POSTS_PER_MONTH]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.POSTS_PER_MONTH)).toBeFalsy();
    });

    it('should handle TEAM_MEMBERS permission based on options', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, team_members: true } as any,
      });

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.TEAM_MEMBERS]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.TEAM_MEMBERS)).toBeTruthy();
    });

    it('should deny TEAM_MEMBERS if option is false', async () => {
        jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
            subscription: null,
            options: { ...pricing.PRO, team_members: false } as any,
        });

        const ability = await service.check('org-1', new Date(), 'USER', [
            [AuthorizationActions.Create, Sections.TEAM_MEMBERS]
        ]);

        expect(ability.can(AuthorizationActions.Create, Sections.TEAM_MEMBERS)).toBeFalsy();
    });

    it('should handle ADMIN permission for admin users', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO } as any,
      });

      const ability = await service.check('org-1', new Date(), 'ADMIN', [
        [AuthorizationActions.Create, Sections.ADMIN]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.ADMIN)).toBeTruthy();
    });

    it('should deny ADMIN permission for regular users', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO } as any,
      });

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.ADMIN]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.ADMIN)).toBeFalsy();
    });

    it('should handle COMMUNITY_FEATURES permission', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, community_features: true } as any,
      });

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.COMMUNITY_FEATURES]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.COMMUNITY_FEATURES)).toBeTruthy();
    });

    it('should handle FEATURED_BY_POSTPILOT permission', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, featured_by_postpilot: true } as any,
      });

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.FEATURED_BY_POSTPILOT]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.FEATURED_BY_POSTPILOT)).toBeTruthy();
    });

    it('should handle AI permission', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, ai: true } as any,
      });

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.AI]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.AI)).toBeTruthy();
    });

    it('should handle IMPORT_FROM_CHANNELS permission', async () => {
      jest.spyOn(service, 'getPackageOptions').mockResolvedValue({
        subscription: null,
        options: { ...pricing.PRO, import_from_channels: true } as any,
      });

      const ability = await service.check('org-1', new Date(), 'USER', [
        [AuthorizationActions.Create, Sections.IMPORT_FROM_CHANNELS]
      ]);

      expect(ability.can(AuthorizationActions.Create, Sections.IMPORT_FROM_CHANNELS)).toBeTruthy();
    });
  });
});
