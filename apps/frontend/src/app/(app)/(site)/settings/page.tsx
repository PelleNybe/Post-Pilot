import { SettingsPopup } from '@postpilot/frontend/components/layout/settings.component';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Settings`,
  description: '',
};
export default async function Index({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
  }>;
}) {
  await searchParams;
  return <SettingsPopup />;
}
