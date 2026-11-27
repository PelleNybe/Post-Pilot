import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { PostsService } from '@postpilot/nestjs-libraries/database/prisma/posts/posts.service';
import { GetOrgFromRequest } from '@postpilot/nestjs-libraries/user/org.from.request';
import { Organization, User } from '@prisma/client';
import { GetPostsDto } from '@postpilot/nestjs-libraries/dtos/posts/get.posts.dto';
import { GetPostsListDto } from '@postpilot/nestjs-libraries/dtos/posts/get.posts.list.dto';
import { CheckPolicies } from '@postpilot/backend/services/auth/permissions/permissions.ability';
import { ApiTags } from '@nestjs/swagger';
import { GeneratorDto } from '@postpilot/nestjs-libraries/dtos/generator/generator.dto';
import { CreateGeneratedPostsDto } from '@postpilot/nestjs-libraries/dtos/generator/create.generated.posts.dto';
import { AgentGraphService } from '@postpilot/nestjs-libraries/agent/agent.graph.service';
import { Response } from 'express';
import { GetUserFromRequest } from '@postpilot/nestjs-libraries/user/user.from.request';
import { ShortLinkService } from '@postpilot/nestjs-libraries/short-linking/short.link.service';
import { CreateTagDto } from '@postpilot/nestjs-libraries/dtos/posts/create.tag.dto';
import {
  AuthorizationActions,
  Sections,
} from '@postpilot/backend/services/auth/permissions/permission.exception.class';

@ApiTags('Posts')
@Controller('/posts')
export class PostsController {
  @Post('/generator/translate')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async generateTranslation(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { content: string; targetLanguage: string }
  ) {
    return this._postsService.translatePost(body.content, body.targetLanguage);
  }

  @Post('/generator/tags')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async generateTags(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { content: string }
  ) {
    return this._postsService.generateTags(body.content);
  }

  @Post('/generator/hooks')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async generateHooks(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { content: string }
  ) {
    return this._postsService.generateHooks(body.content);
  }

  @Post('/generator/tone')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async rewriteTone(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { content: string; tone: string }
  ) {
    return this._postsService.rewriteTone(body.content, body.tone);
  }

  @Put('/bulk-state')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async bulkChangeState(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { ids: string[]; state: string }
  ) {
    return this._postsService.userChangeStateBulk(org.id, body.ids, body.state as any);
  }

  @Post('/:id/approve')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async approvePost(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._postsService.userChangeState(org.id, id, 'QUEUE' as any);
  }

  @Post('/:id/needs-approval')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async markNeedsApproval(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._postsService.userChangeState(org.id, id, 'NEEDS_APPROVAL' as any);
  }

  constructor(
    private _postsService: PostsService,
    private _agentGraphService: AgentGraphService,
    private _shortLinkService: ShortLinkService
  ) {}

  @Get('/:id/statistics')
  async getStatistics(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._postsService.getStatistics(org.id, id);
  }

  @Get('/:id/missing')
  async getMissingContent(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._postsService.getMissingContent(org.id, id);
  }

  @Put('/:id/release-id')
  async updateReleaseId(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body('releaseId') releaseId: string
  ) {
    return this._postsService.updateReleaseId(org.id, id, releaseId);
  }

  @Post('/should-shortlink')
  async shouldShortlink(@Body() body: { messages: string[] }) {
    return { ask: this._shortLinkService.askShortLinkedin(body.messages) };
  }

  @Post('/:id/comments')
  async createComment(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string,
    @Body() body: { comment: string }
  ) {
    return this._postsService.createComment(org.id, user.id, id, body.comment);
  }

  @Get('/tags')
  async getTags(@GetOrgFromRequest() org: Organization) {
    return { tags: await this._postsService.getTags(org.id) };
  }

  @Post('/tags')
  async createTag(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateTagDto
  ) {
    return this._postsService.createTag(org.id, body);
  }

  @Put('/tags/:id')
  async editTag(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateTagDto,
    @Param('id') id: string
  ) {
    return this._postsService.editTag(id, org.id, body);
  }

  @Delete('/tags/:id')
  async deleteTag(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._postsService.deleteTag(id, org.id);
  }

  @Get('/')
  async getPosts(
    @GetOrgFromRequest() org: Organization,
    @Query() query: GetPostsDto
  ) {
    return this._postsService.getPostsMinified(org.id, query);
  }

  @Get('/find-slot')
  async findSlot(@GetOrgFromRequest() org: Organization) {
    return { date: await this._postsService.findFreeDateTime(org.id) };
  }

  @Get('/find-slot/:id')
  async findSlotIntegration(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id?: string
  ) {
    return { date: await this._postsService.findFreeDateTime(org.id, id) };
  }

  @Get('/list')
  async getPostsList(
    @GetOrgFromRequest() org: Organization,
    @Query() query: GetPostsListDto
  ) {
    return this._postsService.getPostsList(org.id, query);
  }

  @Get('/old')
  oldPosts(
    @GetOrgFromRequest() org: Organization,
    @Query('date') date: string
  ) {
    return this._postsService.getOldPosts(org.id, date);
  }

  @Get('/group/:group')
  getPostsByGroup(@GetOrgFromRequest() org: Organization, @Param('group') group: string) {
    return this._postsService.getPostsByGroup(org.id, group);
  }

  @Get('/:id')
  getPost(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._postsService.getPost(org.id, id);
  }

  @Post('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async createPost(
    @GetOrgFromRequest() org: Organization,
    @Body() rawBody: any
  ) {
    const body = await this._postsService.mapTypeToPost(rawBody, org.id);
    return this._postsService.createPost(org.id, body);
  }

  @Post('/generator/draft')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  generatePostsDraft(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateGeneratedPostsDto
  ) {
    return this._postsService.generatePostsDraft(org.id, body);
  }

  @Post('/generator')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async generatePosts(
    @GetOrgFromRequest() org: Organization,
    @Body() body: GeneratorDto,
    @Res({ passthrough: false }) res: Response
  ) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      for await (const event of this._agentGraphService.start(org.id, body)) {
        res.write(JSON.stringify(event) + '\n');
      }
    } catch (err) {
      res.write(JSON.stringify({ error: true, message: 'Internal Server Error' }) + '\n');
    } finally {
      res.end();
    }
  }

  @Delete('/:group')
  @CheckPolicies([AuthorizationActions.Delete, Sections.RBAC_MANAGE_POSTS])
  deletePost(
    @GetOrgFromRequest() org: Organization,
    @Param('group') group: string
  ) {
    return this._postsService.deletePost(org.id, group);
  }

  @Put('/:id/date')
  changeDate(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body('date') date: string,
    @Body('action') action: 'schedule' | 'update' = 'schedule'
  ) {
    return this._postsService.changeDate(org.id, id, date, action);
  }

  @Post('/separate-posts')
  async separatePosts(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { content: string; len: number }
  ) {
    return this._postsService.separatePosts(body.content, body.len);
  }
}
