import { MediaLayoutComponent } from '@postpilot/frontend/components/new-layout/layout.media.component';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Media`,
  description: '',
};

export default async function Page() {
  return <MediaLayoutComponent />
}
