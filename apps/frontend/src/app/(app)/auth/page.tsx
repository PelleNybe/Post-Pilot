import { internalFetch } from '@postpilot/helpers/utils/internal.fetch';
export const dynamic = 'force-dynamic';
import { Register } from '@postpilot/frontend/components/auth/register';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
import Link from 'next/link';
import { getT } from '@postpilot/react/translation/get.translation.service.backend';
import { LoginWithOidc } from '@postpilot/frontend/components/auth/login.with.oidc';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Register`,
  description: '',
};
export default async function Auth({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const t = await getT();
  if (isGeneralServerSide()) {
    let canRegister = true;
    try {
      const response = await internalFetch('/auth/can-register');
      if (response.ok) {
        canRegister = (await response.json())?.register ?? true;
      }
    } catch {
      canRegister = true;
    }
    if (!canRegister && !resolvedSearchParams?.provider) {
      return (
        <>
          <LoginWithOidc />
          <div className="text-center">
            {t('registration_is_disabled', 'Registration is disabled')}
            <br />
            <Link className="underline hover:font-bold" href="/auth/login">
              {t('login_instead', 'Login instead')}
            </Link>
          </div>
        </>
      );
    }
  }
  return <Register />;
}
