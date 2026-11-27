import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';
import {
  ThirdParty,
  ThirdPartyAbstract,
} from '@postpilot/nestjs-libraries/3rdparties/thirdparty.interface';
import { OpenaiService } from '@postpilot/nestjs-libraries/openai/openai.service';
import { timer } from '@postpilot/helpers/utils/timer';

@ThirdParty({
  identifier: 'heygen',
  title: 'HeyGen',
  description: 'HeyGen is a platform for creating AI-generated avatars videos.',
  position: 'media',
  fields: [],
})
export class HeygenProvider extends ThirdPartyAbstract<{
  voice: string;
  avatar: string;
  aspect_ratio: string;
  captions: string;
}> {
  // @ts-ignore
  constructor(private _openaiService: OpenaiService) {
    super();
  }

  async checkConnection(
    apiKey: string
  ): Promise<false | { name: string; username: string; id: string }> {
    const list = await fetch('https://api.heygen.com/v1/user/me', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!list.ok) {
      return false;
    }

    const { data } = await list.json();

    return {
      name: data.first_name + ' ' + data.last_name,
      username: data.username,
      id: data.username,
    };
  }

  async generateVoice(apiKey: string, data: { text: string }) {
    return {
      voice: await this._openaiService.generateVoiceFromText(data.text),
    };
  }

  async voices(apiKey: string) {
    const {
      data: { voices },
    } = await (
      await fetch('https://api.heygen.com/v2/voices', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': apiKey,
        },
      })
    ).json();

    return voices.slice(0, 20);
  }

  async avatars(apiKey: string) {
    const {
      data: { avatar_group_list },
    } = await (
      await fetch(
        'https://api.heygen.com/v2/avatar_group.list?include_public=false',
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'x-api-key': apiKey,
          },
        }
      )
    ).json();

    // ⚡ Bolt: Replaced sequential for...of loop with Promise.all to fetch avatars concurrently
    const loadedAvatarsList = await Promise.all(
      avatar_group_list.map(async (avatar: { id: string }) => {
        const urlToFetch = `https://api.heygen.com/v2/avatar_group/${avatar.id}/avatars`;
        try { await validateUrlForSSRF(urlToFetch); } catch (e) { throw new Error('Invalid URL provided'); }
        const response = await fetch(urlToFetch, {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-api-key': apiKey,
            },
          }
        );
        const {
          data: { avatar_list },
        } = await response.json();
        return avatar_list;
      })
    );

    return loadedAvatarsList.flat();
  }

  async sendData(
    apiKey: string,
    data: {
      voice: string;
      avatar: string;
      aspect_ratio: string;
      captions: string;
      selectedVoice: string;
      type: 'talking_photo' | 'avatar';
    }
  ): Promise<string> {
    const {
      data: { video_id },
    } = await (
      await fetch(`https://api.heygen.com/v2/video/generate`, {
        method: 'POST',
        body: JSON.stringify({
          caption: data.captions === 'yes',
          video_inputs: [
            {
              ...(data.type === 'avatar'
                ? {
                    character: {
                      type: 'avatar',
                      avatar_id: data.avatar,
                    },
                  }
                : {
                    character: {
                      type: 'talking_photo',
                      talking_photo_id: data.avatar,
                    },
                  }),
              voice: {
                type: 'text',
                input_text: data.voice,
                voice_id: data.selectedVoice,
              },
            },
          ],
          dimension:
            data.aspect_ratio === 'story'
              ? {
                  width: 720,
                  height: 1280,
                }
              : {
                  width: 1280,
                  height: 720,
                },
        }),
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-key': apiKey,
        },
      })
    ).json();

    while (true) {
      const {
        data: { status, video_url },
      } = await (
        await fetch(
          `https://api.heygen.com/v1/video_status.get?video_id=${video_id}`,
          {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'x-api-key': apiKey,
            },
          }
        )
      ).json();

      if (status === 'completed') {
        return video_url;
      } else if (status === 'failed') {
        throw new Error('Video generation failed');
      }

      await timer(3000);
    }
  }
}
