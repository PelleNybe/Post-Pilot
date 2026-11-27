import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { SubscriptionService } from '@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { StripeService } from '@postpilot/nestjs-libraries/services/stripe.service';
import { NotificationService } from '@postpilot/nestjs-libraries/database/prisma/notifications/notification.service';
import { Nowpayments } from '@postpilot/nestjs-libraries/crypto/nowpayments';
import { Organization } from '@prisma/client';

describe('BillingController', () => {
  let controller: BillingController;
  let stripeService: StripeService;

  const mockSubscriptionService = {};
  const mockStripeService = {
    finishTrial: jest.fn(),
  };
  const mockNotificationService = {};
  const mockNowpayments = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Nowpayments, useValue: mockNowpayments },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    stripeService = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('finishTrial', () => {
    const mockOrg = { paymentId: 'cust_123' } as Organization;

    it('should return { finish: true } when stripeService.finishTrial succeeds', async () => {
      mockStripeService.finishTrial.mockResolvedValue(undefined);

      const result = await controller.finishTrial(mockOrg);

      expect(result).toEqual({ finish: true });
      expect(stripeService.finishTrial).toHaveBeenCalledWith('cust_123');
    });

    it('should return { finish: true } even when stripeService.finishTrial throws an error', async () => {
      mockStripeService.finishTrial.mockRejectedValue(new Error('Stripe error'));

      const result = await controller.finishTrial(mockOrg);

      expect(result).toEqual({ finish: true });
      expect(stripeService.finishTrial).toHaveBeenCalledWith('cust_123');
    });
  });
});
