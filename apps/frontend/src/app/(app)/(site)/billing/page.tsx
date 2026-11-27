export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@postpilot/helpers/utils/is.general.server.side';
import { MainBillingComponent } from '@postpilot/frontend/components/billing/main.billing.component';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'PostPilot' : 'PostPilot'} Billing`,
  description: '',
};

export default async function Page() {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="bg-newBgColorInner flex-1 flex-col flex p-[20px] gap-[12px] justify-center items-center">
        <h1 className="text-2xl font-bold">Billing Disabled</h1>
        <p>This self-hosted instance of PostPilot provides all features for free.</p>
      </div>
    );
  }

  return <MainBillingComponent />;
}