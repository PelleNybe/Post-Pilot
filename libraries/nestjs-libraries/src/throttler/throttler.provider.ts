import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  public override async canActivate(
    context: ExecutionContext
  ): Promise<boolean> {
    const { url, method } = context.switchToHttp().getRequest<Request>();
    if (
      (method === 'POST' && url.includes('/public/v1/posts')) ||
      (method === 'POST' &&
        (url.includes('/auth/login') ||
          url.includes('/auth/register') ||
          url.includes('/auth/forgot')))
    ) {
      return super.canActivate(context);
    }

    return true;
  }

  protected override async getTracker(
    req: Record<string, any>
  ): Promise<string> {
    const identity = req?.org?.id || req?.ip || 'anonymous';
    const scope = req?.url?.indexOf('/posts') > -1 ? 'posts' : 'auth';
    return `${identity}_${scope}`;
  }
}
