import { getT } from '@postpilot/react/translation/get.translation.service.backend';

export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import Image from 'next/image';
import loadDynamic from 'next/dynamic';
import { TestimonialComponent } from '@postpilot/frontend/components/auth/testimonial.component';
import { LogoTextComponent } from '@postpilot/frontend/components/ui/logo-text.component';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getT();

  return (
    <div className="bg-[#0E0E0E] flex flex-1 p-[12px] gap-[12px] min-h-screen w-screen text-white">
      {/*<style>{`html, body {overflow-x: hidden;}`}</style>*/}
      <ReturnUrlComponent />
      <div className="flex flex-col py-[40px] px-[20px] flex-1 lg:w-[600px] lg:flex-none rounded-[12px] text-white p-[12px] bg-[#1A1919]">
        <div className="w-full max-w-[440px] mx-auto justify-center gap-[20px] flex-1 flex flex-col text-white">
          <LogoTextComponent />
          <div className="flex">{children}</div>
        </div>
        <footer className="w-full max-w-[440px] mx-auto pt-6 text-center text-[11px] text-[#A1A1A1]/70">
          PostPilot by{' '}
          <a
            href="https://coraxcolab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Corax CoLAB
          </a>{' '}
          · Developed by{' '}
          <a
            href="https://github.com/PelleNybe"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Pelle
          </a>{' '}
          ·{' '}
          <a
            href="https://buymeacoffee.com/pellenybe"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Sponsor
          </a>
        </footer>
      </div>
      <div className="text-[36px] flex-1 pt-[88px] hidden lg:flex flex-col items-center overflow-y-auto pb-[40px] px-[40px] gap-[40px]">

        <div className="flex flex-col gap-[24px] max-w-[800px] w-full text-center items-center justify-center pt-[10vh]">
            <h1 className="text-[54px] font-[800] leading-tight text-white mb-4">
              Schedule. Grow. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FC69FF] to-[#612BD3]">Dominate.</span>
            </h1>
            <p className="text-[20px] text-[#A1A1A1] max-w-[600px] mx-auto">
              Your AI-powered Social Media Engine. Fully open source, built for creators and enterprises alike.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-6 w-full text-left">
              <div className="bg-[#2b2a2a] p-6 rounded-2xl border border-[#3e3d3d] hover:border-[#612BD3] transition-colors">
                <div className="h-12 w-12 rounded-full bg-[#FC69FF]/20 flex items-center justify-center mb-4">
                  <span className="text-[24px]">🚀</span>
                </div>
                <h3 className="text-[18px] font-bold text-white mb-2">Automated Workflows</h3>
                <p className="text-[14px] text-[#D1D1D1]">Set up approval chains, auto-post schedules, and manage multi-tenant environments seamlessly.</p>
              </div>
              <div className="bg-[#2b2a2a] p-6 rounded-2xl border border-[#3e3d3d] hover:border-[#612BD3] transition-colors">
                <div className="h-12 w-12 rounded-full bg-[#612BD3]/20 flex items-center justify-center mb-4">
                  <span className="text-[24px]">🤖</span>
                </div>
                <h3 className="text-[18px] font-bold text-white mb-2">AI Integrations</h3>
                <p className="text-[14px] text-[#D1D1D1]">Generate posts, auto-translate content, and find viral hashtags instantly using built-in AI tools.</p>
              </div>
            </div>
        </div>


        <div className="text-center mt-[20px]">
          Over <span className="text-[42px] text-[#FC69FF]">20,000+</span>{' '}
          Entrepreneurs use
          <br />
          PostPilot (produced by{' '}
          <a
            href="https://coraxcolab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#612BD3] underline-offset-4 hover:text-[#FC69FF] transition-colors"
          >
            Corax CoLAB
          </a>
          ) To Grow Their Social Presence
        </div>
        <TestimonialComponent />
      </div>
    </div>
  );
}
