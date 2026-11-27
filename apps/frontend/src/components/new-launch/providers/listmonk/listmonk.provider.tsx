'use client';

import {
  PostComment,
  withProvider,
} from '@postpilot/frontend/components/new-launch/providers/high.order.provider';
import { ListmonkDto } from '@postpilot/nestjs-libraries/dtos/posts/providers-settings/listmonk.dto';
import { Input } from '@postpilot/react/form/input';
import { useSettings } from '@postpilot/frontend/components/launches/helpers/use.values';
import { SelectList } from '@postpilot/frontend/components/new-launch/providers/listmonk/select.list';
import { SelectTemplates } from '@postpilot/frontend/components/new-launch/providers/listmonk/select.templates';

const SettingsComponent = () => {
  const form = useSettings();

  return (
    <>
      <Input label="Subject" {...form.register('subject')} />
      <Input label="Preview" {...form.register('preview')} />
      <SelectList {...form.register('list')} />
      <SelectTemplates {...form.register('template')} />
    </>
  );
};

export default withProvider({
  postComment: PostComment.POST,
  minimumCharacters: [],
  SettingsComponent: SettingsComponent,
  CustomPreviewComponent: undefined,
  dto: ListmonkDto,
  checkValidity: undefined,
  maximumCharacters: 300000,
});
