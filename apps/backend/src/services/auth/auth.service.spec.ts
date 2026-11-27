import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '@postpilot/nestjs-libraries/database/prisma/users/users.service';
import { OrganizationService } from '@postpilot/nestjs-libraries/database/prisma/organizations/organization.service';
import { NotificationService } from '@postpilot/nestjs-libraries/database/prisma/notifications/notification.service';
import { EmailService } from '@postpilot/nestjs-libraries/services/email.service';
import { AuthProviderManager } from '@postpilot/backend/services/auth/providers/providers.manager';
import { Provider } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let organizationService: OrganizationService;
  const originalEnv = { ...process.env };

  const mockUsersService = {};
  const mockOrganizationService = {
    getCount: jest.fn(),
  };
  const mockNotificationService = {};
  const mockEmailService = {};
  const mockAuthProviderManager = {};

  beforeEach(async () => {
    jest.resetAllMocks();

    // Restore original env before each test
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.assign(process.env, originalEnv);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuthProviderManager, useValue: mockAuthProviderManager },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    organizationService = module.get<OrganizationService>(OrganizationService);
  });

  afterAll(() => {
    // Final restoration
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canRegister', () => {
    it('should return true when DISABLE_REGISTRATION is not true', async () => {
      process.env.DISABLE_REGISTRATION = 'false';
      const result = await service.canRegister(Provider.GITHUB);
      expect(result).toBe(true);
    });

    it('should return true when DISABLE_REGISTRATION is true but provider is GENERIC', async () => {
      process.env.DISABLE_REGISTRATION = 'true';
      const result = await service.canRegister(Provider.GENERIC);
      expect(result).toBe(true);
    });

    it('should return true when DISABLE_REGISTRATION is true, provider is not GENERIC, and org count is 0', async () => {
      process.env.DISABLE_REGISTRATION = 'true';
      (organizationService.getCount as jest.Mock).mockResolvedValue(0);
      const result = await service.canRegister(Provider.GITHUB);
      expect(result).toBe(true);
      expect(organizationService.getCount).toHaveBeenCalled();
    });

    it('should return false when DISABLE_REGISTRATION is true, provider is not GENERIC, and org count > 0', async () => {
      process.env.DISABLE_REGISTRATION = 'true';
      (organizationService.getCount as jest.Mock).mockResolvedValue(1);
      const result = await service.canRegister(Provider.GITHUB);
      expect(result).toBe(false);
      expect(organizationService.getCount).toHaveBeenCalled();
    });
  });
});
