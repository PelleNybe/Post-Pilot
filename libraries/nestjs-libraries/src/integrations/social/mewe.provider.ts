import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';
import { MeweDto } from '@postpilot/nestjs-libraries/dtos/posts/providers-settings/mewe.dto';
import type {
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@postpilot/nestjs-libraries/integrations/social/social.integrations.interface';
import { SocialAbstract } from '@postpilot/nestjs-libraries/integrations/social.abstract';
import { Tool } from '@postpilot/nestjs-libraries/integrations/tool.decorator';
import { makeId } from '@postpilot/nestjs-libraries/services/make.is';
import type { Integration } from '@prisma/client';
import dayjs from 'dayjs';
import { Logger } from '@nestjs/common';

export class MeweProvider extends SocialAbstract implements SocialProvider {
  identifier = 'mewe';
  name = 'MeWe';
  isBetweenSteps = false;
  scopes = [] as string[];
  editor = 'normal' as const;
  dto = MeweDto;

  private get meweHost() {
    return process.env.MEWE_HOST || 'https://mewe.com';
  }

  private authHeaders(apiToken: string) {
    return {
      'X-App-Id': process.env.MEWE_APP_ID!,
      'X-Api-Key': process.env.MEWE_API_KEY!,
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  maxLength() {
    return 63206;
  }

  override handleErrors(
    body: string,
  ):
    | { type: 'refresh-token' | 'bad-body' | 'retry'; value: string }
    | undefined {
    if (body.indexOf('Unauthorized') > -1) {
      return {
        type: 'refresh-token' as const,
        value: 'Access token expired, please re-authenticate',
      };
    }

    if (body.indexOf('Enhance Your Calm') > -1 || body.indexOf('420') > -1) {
      return {
        type: 'retry' as const,
        value: 'Rate limited, retrying...',
      };
    }

    if (body.indexOf('Forbidden') > -1) {
      return {
        type: 'bad-body' as const,
        value: 'Insufficient permissions for this action',
      };
    }

    return undefined;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenDetails> {
    return {
      refreshToken: '',
      expiresIn: 0,
      accessToken: '',
      id: '',
      name: '',
      picture: '',
      username: '',
    };
  }

  async generateAuthUrl() {
    const state = makeId(6);
    return {
      url:
        `${this.meweHost}/login` +
        `?client_id=${process.env.MEWE_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(
          `${process.env.FRONTEND_URL}/integrations/social/mewe`,
        )}` +
        `&state=${state}`,
      codeVerifier: makeId(10),
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }) {
    const loginRequestToken = params.code;

    if (!loginRequestToken) {
      return 'No login request token received. Please try again.';
    }

    try {
      // Exchange loginRequestToken for apiToken
      const tokenResponse = await this.fetch(
        `${this.meweHost}/api/dev/token?loginRequestToken=${loginRequestToken}`,
        {
          method: 'GET',
          headers: {
            'X-App-Id': process.env.MEWE_APP_ID!,
            'X-Api-Key': process.env.MEWE_API_KEY!,
          },
        },
      );

      if (!tokenResponse.ok) {
        return 'Failed to exchange token. Please try again.';
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.pending) {
        return 'Login request is still pending. Please approve on MeWe and try again.';
      }

      if (!tokenData.apiToken) {
        return 'No API token received. Please try again.';
      }

      const apiToken = tokenData.apiToken;
      const expiresAt = tokenData.expiresAt;

      // Fetch user profile
      const profileResponse = await this.fetch(`${this.meweHost}/api/dev/me`, {
        method: 'GET',
        headers: this.authHeaders(apiToken),
      });

      if (!profileResponse.ok) {
        return 'Failed to fetch MeWe profile.';
      }

      const profile = await profileResponse.json();

      const expiresIn = expiresAt
        ? dayjs(expiresAt).unix() - dayjs().unix()
        : dayjs().add(30, 'days').unix() - dayjs().unix();

      return {
        id: profile.userId,
        name:
          profile.name ||
          `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        accessToken: apiToken,
        refreshToken: '',
        expiresIn,
        picture: '',
        username: profile.handle || '',
      };
    } catch (e) {
      Logger.log(e);
      return 'MeWe authentication failed. Please try again.';
    }
  }

  @Tool({ description: 'Groups', dataSchema: [] })
  async groups(
    accessToken: string,
    params: any,
    id: string,
    integration: Integration,
  ) {
    try {
      const allGroups: any[] = [];
      let nextUrl: string | null = `${this.meweHost}/api/dev/groups`;

      while (nextUrl) {
        try {
          await validateUrlForSSRF(nextUrl);
        } catch (e) {
          throw new Error('Invalid URL provided');
        }
        const response = await this.fetch(nextUrl, {
          method: 'GET',
          headers: this.authHeaders(accessToken),
        });

        if (!response.ok) break;

        const data = await response.json();
        allGroups.push(...(data.groups || []));
        nextUrl = data.nextPage ? `${this.meweHost}${data.nextPage}` : null;
      }

      return allGroups.map((group: any) => ({
        id: String(group.groupId),
        name: group.name,
      }));
    } catch (err) {
      return [];
    }
  }

  private async uploadPhoto(
    accessToken: string,
    mediaPath: string,
  ): Promise<string> {
    try {
      await validateUrlForSSRF(mediaPath);
    } catch (e) {
      throw new Error('Invalid URL provided');
    }
    const mediaResponse = await this.fetch(mediaPath);
    const blob = await mediaResponse.blob();
    const fileName = mediaPath.split('/').pop() || 'photo.jpg';

    const form = new FormData();
    form.append('file', blob, fileName);

    const uploadResponse = await this.fetch(
      `${this.meweHost}/api/dev/photo/upload`,
      {
        method: 'POST',
        headers: {
          'X-App-Id': process.env.MEWE_APP_ID!,
          'X-Api-Key': process.env.MEWE_API_KEY!,
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      },
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Photo upload failed: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    return uploadData.id;
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails<MeweDto>[],
    integration: Integration,
  ): Promise<PostResponse[]> {
    const [firstPost] = postDetails;
    const postType = firstPost.settings.postType || 'group';
    const groupId = firstPost.settings.group;

    // Upload photos if present (exclude videos)
    const imageMedia =
      firstPost.media?.filter((m) => !m.path || m.path.indexOf('mp4') === -1) ||
      [];

    // ⚡ Bolt: Parallelize photo uploads for MeWe
    const photoUploadPromises = imageMedia.map((media) =>
      this.uploadPhoto(accessToken, media.path),
    );
    const uploadedPhotoIds: string[] = await Promise.all(photoUploadPromises);

    const postBody: Record<string, any> = { text: firstPost.message };
    if (uploadedPhotoIds.length > 0) {
      postBody.uploadedPhotoIds = uploadedPhotoIds;
    }

    const postUrl =
      postType === 'timeline'
        ? `${this.meweHost}/api/dev/me/post`
        : `${this.meweHost}/api/dev/group/${groupId}/post`;

    // MeWe post endpoint may return 204 (no content), so use raw fetch
    const postResponse = await this.fetch(postUrl, {
      method: 'POST',
      headers: this.authHeaders(accessToken),
      body: JSON.stringify(postBody),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      Logger.log(errorText);
      const handleError = this.handleErrors(errorText);
      if (handleError) {
        throw new Error(handleError.value);
      }
      throw new Error('Failed to create MeWe post');
    }

    let postId = '';
    try {
      const responseData = await postResponse.json();
      postId = responseData.postId || responseData.id || makeId(12);
    } catch {
      postId = makeId(12);
    }

    const releaseURL = `${this.meweHost}/post/show/${postId}`;

    return [
      {
        id: firstPost.id,
        postId,
        releaseURL,
        status: 'success',
      },
    ];
  }
}
