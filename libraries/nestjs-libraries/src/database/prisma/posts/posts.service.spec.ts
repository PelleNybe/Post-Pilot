import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { IntegrationManager } from '@postpilot/nestjs-libraries/integrations/integration.manager';
import { IntegrationService } from '@postpilot/nestjs-libraries/database/prisma/integrations/integration.service';
import { MediaService } from '@postpilot/nestjs-libraries/database/prisma/media/media.service';
import { ShortLinkService } from '@postpilot/nestjs-libraries/short-linking/short.link.service';
import { OpenaiService } from '@postpilot/nestjs-libraries/openai/openai.service';
import { RefreshIntegrationService } from '@postpilot/nestjs-libraries/integrations/refresh.integration.service';
import { TemporalService } from 'nestjs-temporal-core';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('PostsService', () => {
  let service: any;
  let temporalClientMock: any;

  beforeEach(async () => {
    temporalClientMock = {
      workflow: {
        list: jest.fn().mockReturnValue([]),
      },
      getWorkflowHandle: jest.fn(),
    };

    const temporalServiceMock = {
      client: {
        getRawClient: () => temporalClientMock,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PostsRepository, useValue: {} },
        { provide: IntegrationManager, useValue: {} },
        { provide: IntegrationService, useValue: {} },
        { provide: MediaService, useValue: {} },
        { provide: ShortLinkService, useValue: {} },
        { provide: OpenaiService, useValue: {} },
        { provide: TemporalService, useValue: temporalServiceMock },
        { provide: RefreshIntegrationService, useValue: {} },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    service._temporalService = temporalServiceMock;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('terminatePostWorkflows', () => {
    it('should throw BadRequestException if postId is not a valid UUID', async () => {
      const invalidPostId = '123" OR "1"="1';
      await expect(service.terminatePostWorkflows(invalidPostId)).rejects.toThrow(BadRequestException);
    });

    it('should call workflow.list with escaped query', async () => {
      const validPostId = '123e4567-e89b-12d3-a456-426614174000';
      await service.terminatePostWorkflows(validPostId);

      expect(temporalClientMock.workflow.list).toHaveBeenCalledWith({
        query: `postId="${validPostId}" AND ExecutionStatus="Running"`,
      });
    });
  });
});
