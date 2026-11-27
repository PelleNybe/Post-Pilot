export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { PlatformAnalytics } from '@postpilot/frontend/components/platform-analytics/platform.analytics';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Analytics`,
  description: '',
};
export default async function Index() {
  return <PlatformAnalytics />;
}
