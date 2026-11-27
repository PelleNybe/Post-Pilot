import { Plugs } from '@postpilot/frontend/components/plugs/plugs';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Plugs`,
  description: '',
};
export default async function Index() {
  return <Plugs />;
}
