import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ThirdPartyController } from './third-party.controller';
import { ThirdPartyManager } from '@postpilot/nestjs-libraries/3rdparties/thirdparty.manager';
import { MediaService } from '@postpilot/nestjs-libraries/database/prisma/media/media.service';
import { AuthService } from '@postpilot/helpers/auth/auth.service';

describe('ThirdPartyController', () => {
  let controller: ThirdPartyController;
  const mockThirdPartyManager = {
    getIntegrationById: jest.fn(),
    getThirdPartyByName: jest.fn(),
  };
  const mockMediaService = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThirdPartyController],
      providers: [
        { provide: ThirdPartyManager, useValue: mockThirdPartyManager },
        { provide: MediaService, useValue: mockMediaService },
      ],
    }).compile();

    controller = module.get(ThirdPartyController);
  });

  it('blocks non-allowlisted / prototype method invocation in callFunction', async () => {
    class FakeThirdParty {
      voices = jest.fn();
      sendData = jest.fn();
    }
    mockThirdPartyManager.getIntegrationById.mockResolvedValue({
      id: 'tp-1',
      identifier: 'elevenlabs',
      apiKey: 'enc',
    });
    mockThirdPartyManager.getThirdPartyByName.mockReturnValue({
      instance: new FakeThirdParty(),
    });

    await expect(
      controller.callFunction({ id: 'org-1' } as any, 'tp-1', 'sendData', {})
    ).rejects.toThrow(HttpException);

    await expect(
      controller.callFunction({ id: 'org-1' } as any, 'tp-1', 'toString', {})
    ).rejects.toThrow('Invalid function name');
  });

  it('invokes allowlisted prototype method on third-party instance with decrypted key', async () => {
    const spy = jest.spyOn(AuthService, 'fixedDecryption').mockReturnValue('plain-key');
    class FakeVoiceThirdParty {
      voices(apiKey: string, data: any) {
        return { apiKey, data };
      }
    }
    mockThirdPartyManager.getIntegrationById.mockResolvedValue({
      id: 'tp-1',
      identifier: 'elevenlabs',
      apiKey: 'cipher',
    });
    mockThirdPartyManager.getThirdPartyByName.mockReturnValue({
      instance: new FakeVoiceThirdParty(),
    });

    const result = await controller.callFunction(
      { id: 'org-1' } as any,
      'tp-1',
      'voices',
      { q: 'en' }
    );

    expect(result).toEqual({ apiKey: 'plain-key', data: { q: 'en' } });
    spy.mockRestore();
  });
});
