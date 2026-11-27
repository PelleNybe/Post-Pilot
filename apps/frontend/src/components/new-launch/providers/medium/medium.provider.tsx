'use client';

import { FC } from 'react';
import {
  PostComment,
  withProvider,
} from '@postpilot/frontend/components/new-launch/providers/high.order.provider';
import { useSettings } from '@postpilot/frontend/components/launches/helpers/use.values';
import { Input } from '@postpilot/react/form/input';
import { MediumPublications } from '@postpilot/frontend/components/new-launch/providers/medium/medium.publications';
import { MediumTags } from '@postpilot/frontend/components/new-launch/providers/medium/medium.tags';
import { MediumSettingsDto } from '@postpilot/nestjs-libraries/dtos/posts/providers-settings/medium.settings.dto';
import { useIntegration } from '@postpilot/frontend/components/launches/helpers/use.integration';
import { Canonical } from '@postpilot/react/form/canonical';

const MediumSettings: FC = () => {
  const form = useSettings();
  const { date } = useIntegration();
  return (
    <>
      <Input label="Title" {...form.register('title')} />
      <Input label="Subtitle" {...form.register('subtitle')} />
      <Canonical
        date={date}
        label="Canonical Link"
        {...form.register('canonical')}
      />
      <div>
        <MediumPublications {...form.register('publication')} />
      </div>
      <div>
        <MediumTags label="Topics" {...form.register('tags')} />
      </div>
    </>
  );
};
export default withProvider({
  postComment: PostComment.POST,
  minimumCharacters: [],
  SettingsComponent: MediumSettings,
  CustomPreviewComponent: undefined, //MediumPreview,
  dto: MediumSettingsDto,
  checkValidity: undefined,
  maximumCharacters: 100000,
});
