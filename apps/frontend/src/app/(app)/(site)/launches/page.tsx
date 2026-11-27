export const dynamic = 'force-dynamic';
import { LaunchesComponent } from '@postpilot/frontend/components/launches/launches.component';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot Calendar' : 'PostPilot Launches'}`,
  description: '',
};
export default async function Index() {
  return <LaunchesComponent />;
}
