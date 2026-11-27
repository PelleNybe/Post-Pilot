import { IntegrationValidationTool } from '@postpilot/nestjs-libraries/chat/tools/integration.validation.tool';
import { IntegrationTriggerTool } from '@postpilot/nestjs-libraries/chat/tools/integration.trigger.tool';
import { IntegrationSchedulePostTool } from './integration.schedule.post';
import { GenerateVideoOptionsTool } from '@postpilot/nestjs-libraries/chat/tools/generate.video.options.tool';
import { VideoFunctionTool } from '@postpilot/nestjs-libraries/chat/tools/video.function.tool';
import { GenerateVideoTool } from '@postpilot/nestjs-libraries/chat/tools/generate.video.tool';
import { GenerateImageTool } from '@postpilot/nestjs-libraries/chat/tools/generate.image.tool';
import { IntegrationListTool } from '@postpilot/nestjs-libraries/chat/tools/integration.list.tool';

export const toolList = [
  IntegrationListTool,
  IntegrationValidationTool,
  IntegrationTriggerTool,
  IntegrationSchedulePostTool,
  GenerateVideoOptionsTool,
  VideoFunctionTool,
  GenerateVideoTool,
  GenerateImageTool,
];
