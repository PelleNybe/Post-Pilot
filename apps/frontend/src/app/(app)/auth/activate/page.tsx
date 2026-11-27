export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { Activate } from '@postpilot/frontend/components/auth/activate';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${
    isGeneralServerSide() ? 'PostPilot' : 'PostPilot'
  } - Activate your account`,
  description: '',
};
export default async function Auth() {
  return <Activate />;
}
