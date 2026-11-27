export const dynamic = 'force-dynamic';
import { Forgot } from '@postpilot/frontend/components/auth/forgot';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Forgot Password`,
  description: '',
};
export default async function Auth() {
  return <Forgot />;
}
