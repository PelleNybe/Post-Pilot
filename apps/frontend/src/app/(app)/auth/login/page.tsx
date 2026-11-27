export const dynamic = 'force-dynamic';
import { Login } from '@postpilot/frontend/components/auth/login';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Login`,
  description: '',
};
export default async function Auth() {
  return <Login />;
}
