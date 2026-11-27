import { Nowpayments, ProcessPayment } from './nowpayments';
import { SubscriptionService } from '@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { AuthService } from '@postpilot/helpers/auth/auth.service';
import crypto from 'crypto';

jest.mock('@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service');
jest.mock('@postpilot/helpers/auth/auth.service');

describe('Nowpayments', () => {
  let nowpayments: Nowpayments;
  let subscriptionService: jest.Mocked<SubscriptionService>;

  const mockSecret = 'test_secret';
  const mockOrderId = 'org1_id123';
  const mockPath = 'mock_jwt_token';
  const mockBody: ProcessPayment = {
    payment_id: 123,
    payment_status: 'finished',
    pay_address: '0x123',
    price_amount: 10,
    price_currency: 'usd',
    pay_amount: 10,
    actually_paid: 10,
    pay_currency: 'sol',
    order_id: mockOrderId,
    order_description: 'test',
    purchase_id: 'p123',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    outcome_amount: 10,
    outcome_currency: 'usd',
  };

  beforeEach(() => {
    subscriptionService = new SubscriptionService(null as any) as jest.Mocked<SubscriptionService>;
    nowpayments = new Nowpayments(subscriptionService);
    process.env.NOWPAYMENTS_IPN_SECRET = mockSecret;
    process.env.JWT_SECRET = 'jwt_secret';
  });

  afterEach(() => {
    delete process.env.NOWPAYMENTS_IPN_SECRET;
  });

  const generateSignature = (body: any, secret: string) => {
    const hmac = crypto.createHmac('sha512', secret);
    const sortedBody = JSON.stringify(body, Object.keys(body).sort());
    hmac.update(sortedBody);
    return hmac.digest('hex');
  };

  it('should process payment with valid signature and order_id', async () => {
    const signature = generateSignature(mockBody, mockSecret);
    (AuthService.verifyJWT as jest.Mock).mockReturnValue({ order_id: mockOrderId });

    const result = await nowpayments.processPayment(mockPath, mockBody, signature);

    expect(result).toEqual(mockBody);
    expect(subscriptionService.lifeTime).toHaveBeenCalledWith('org1', 'id123', 'PRO');
  });

  it('should reject payment with invalid signature', async () => {
    const signature = 'invalid_signature';
    (AuthService.verifyJWT as jest.Mock).mockReturnValue({ order_id: mockOrderId });

    const result = await nowpayments.processPayment(mockPath, mockBody, signature);

    expect(result).toBeUndefined();
    expect(subscriptionService.lifeTime).not.toHaveBeenCalled();
  });

  it('should reject payment if signature is missing when secret is set', async () => {
    (AuthService.verifyJWT as jest.Mock).mockReturnValue({ order_id: mockOrderId });

    const result = await nowpayments.processPayment(mockPath, mockBody);

    expect(result).toBeUndefined();
    expect(subscriptionService.lifeTime).not.toHaveBeenCalled();
  });

  it('should reject payment if order_id in body does not match order_id in JWT', async () => {
    const signature = generateSignature(mockBody, mockSecret);
    (AuthService.verifyJWT as jest.Mock).mockReturnValue({ order_id: 'different_order_id' });

    const result = await nowpayments.processPayment(mockPath, mockBody, signature);

    expect(result).toBeUndefined();
    expect(subscriptionService.lifeTime).not.toHaveBeenCalled();
  });

  it('should reject payment if status is not confirmed or finished', async () => {
    const pendingBody = { ...mockBody, payment_status: 'waiting' };
    const signature = generateSignature(pendingBody, mockSecret);
    (AuthService.verifyJWT as jest.Mock).mockReturnValue({ order_id: mockOrderId });

    const result = await nowpayments.processPayment(mockPath, pendingBody, signature);

    expect(result).toBeUndefined();
    expect(subscriptionService.lifeTime).not.toHaveBeenCalled();
  });

  it('should process payment without signature check if NOWPAYMENTS_IPN_SECRET is not set', async () => {
    delete process.env.NOWPAYMENTS_IPN_SECRET;
    (AuthService.verifyJWT as jest.Mock).mockReturnValue({ order_id: mockOrderId });

    const result = await nowpayments.processPayment(mockPath, mockBody);

    expect(result).toEqual(mockBody);
    expect(subscriptionService.lifeTime).toHaveBeenCalledWith('org1', 'id123', 'PRO');
  });
});
