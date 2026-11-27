'use client';

import {
  PostComment,
  withProvider,
} from '@postpilot/frontend/components/new-launch/providers/high.order.provider';
import { FacebookDto } from '@postpilot/nestjs-libraries/dtos/posts/providers-settings/facebook.dto';
import { Input } from '@postpilot/react/form/input';
import { useSettings } from '@postpilot/frontend/components/launches/helpers/use.values';
import { FacebookPreview } from '@postpilot/frontend/components/new-launch/providers/facebook/facebook.preview';

export const FacebookSettings = () => {
  const { register } = useSettings();

  return (
    <Input
      label={
        'Embedded URL (only for text Post)'
      }
      {...register('url')}
    />
  );
};

export default withProvider({
  postComment: PostComment.COMMENT,
  minimumCharacters: [],
  SettingsComponent: FacebookSettings,
  CustomPreviewComponent: FacebookPreview,
  dto: FacebookDto,
  checkValidity: undefined,
  maximumCharacters: 63206,
});
