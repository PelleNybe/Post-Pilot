export const dynamic = 'force-dynamic';
import { ForgotReturn } from '@postpilot/frontend/components/auth/forgot-return';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Forgot Password`,
  description: '',
};
export default async function Auth({
  params,
}: {
  params: Promise<{
    token: string;
  }>;
}) {
  const { token } = await params;
  return <ForgotReturn token={token} />;
}
