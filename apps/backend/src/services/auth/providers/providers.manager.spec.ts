import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { AuthProviderManager } from './providers.manager';
import { AuthProvider, AuthProviderAbstract } from '../providers.interface';
import { Provider } from '@prisma/client';
import 'reflect-metadata';

@AuthProvider({ provider: 'MOCK_PROVIDER' })
class MockProvider extends AuthProviderAbstract {
  generateLink = jest.fn();
  getToken = jest.fn();
  getUser = jest.fn();
}

describe('AuthProviderManager', () => {
  let manager: AuthProviderManager;
  let moduleRef: ModuleRef;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthProviderManager,
        {
          provide: ModuleRef,
          useValue: {
            get: jest.fn(),
          },
        },
        MockProvider,
      ],
    }).compile();

    manager = module.get<AuthProviderManager>(AuthProviderManager);
    moduleRef = module.get<ModuleRef>(ModuleRef);
  });

  it('should be defined', () => {
    expect(manager).toBeDefined();
  });

  describe('getProvider', () => {
    it('should return a provider if it exists', () => {
      const mockProviderInstance = new MockProvider();
      (moduleRef.get as jest.Mock).mockReturnValue(mockProviderInstance);

      // Using a string here because our MockProvider is registered with 'MOCK_PROVIDER'
      const provider = manager.getProvider('MOCK_PROVIDER');
      expect(provider).toBe(mockProviderInstance);
      expect(moduleRef.get).toHaveBeenCalledWith(MockProvider, { strict: false });
    });

    it('should work with Provider enum if registered', () => {
      @AuthProvider({ provider: Provider.GOOGLE })
      class MockGoogleProvider extends AuthProviderAbstract {
        generateLink = jest.fn();
        getToken = jest.fn();
        getUser = jest.fn();
      }

      const mockGoogleInstance = new MockGoogleProvider();
      (moduleRef.get as jest.Mock).mockReturnValue(mockGoogleInstance);

      const provider = manager.getProvider(Provider.GOOGLE);
      expect(provider).toBe(mockGoogleInstance);
      expect(moduleRef.get).toHaveBeenCalledWith(MockGoogleProvider, { strict: false });
    });

    it('should throw an error if provider does not exist', () => {
      expect(() => manager.getProvider('NON_EXISTENT')).toThrow(
        'Auth provider NON_EXISTENT not found'
      );
    });
  });
});
