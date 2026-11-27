"use client";

import { Logo } from "@postpilot/frontend/components/new-layout/logo";
import { Plus_Jakarta_Sans } from "next/font/google";
import React, { type ReactNode, useCallback } from "react";

const ModeComponent = dynamic(
	() => import("@postpilot/frontend/components/layout/mode.component"),
	{
		ssr: false,
	},
);

import { CopilotKit } from "@copilotkit/react-core";
import { FirstBillingComponent } from "@postpilot/frontend/components/billing/first.billing.component";
import { ShowLinkedinCompany } from "@postpilot/frontend/components/launches/helpers/linkedin.component";
import { MediaSettingsLayout } from "@postpilot/frontend/components/launches/helpers/media.settings.component";
import { CheckPayment } from "@postpilot/frontend/components/layout/check.payment";
import { ChromeExtensionComponent } from "@postpilot/frontend/components/layout/chrome.extension.component";
import { ContinueProvider } from "@postpilot/frontend/components/layout/continue.provider";
import { Impersonate } from "@postpilot/frontend/components/layout/impersonate";
import { InteractiveBackground } from "@postpilot/frontend/components/layout/interactive-background/interactive-bg";
import { LanguageComponent } from "@postpilot/frontend/components/layout/language.component";
import { NewSubscription } from "@postpilot/frontend/components/layout/new.subscription";
import { OrganizationSelector } from "@postpilot/frontend/components/layout/organization.selector";
import { PreConditionComponent } from "@postpilot/frontend/components/layout/pre-condition.component";
import { StreakComponent } from "@postpilot/frontend/components/layout/streak.component";
import { Support } from "@postpilot/frontend/components/layout/support";
import { Title } from "@postpilot/frontend/components/layout/title";
import { TopMenu } from "@postpilot/frontend/components/layout/top.menu";
import { ToolTip } from "@postpilot/frontend/components/layout/top.tip";
import { ContextWrapper } from "@postpilot/frontend/components/layout/user.context";
import { ShowMediaBoxModal } from "@postpilot/frontend/components/media/media.component";
import { AttachToFeedbackIcon } from "@postpilot/frontend/components/new-layout/sentry.feedback.component";
import NotificationComponent from "@postpilot/frontend/components/notifications/notification.component";
import { ShowPostSelector } from "@postpilot/frontend/components/post-url-selector/post.url.selector";
import { useFetch } from "@postpilot/helpers/utils/custom.fetch";
import { MantineWrapper } from "@postpilot/react/helpers/mantine.wrapper";
import { useVariables } from "@postpilot/react/helpers/variable.context";
import { Toaster } from "@postpilot/react/toaster/toaster";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

const jakartaSans = Plus_Jakarta_Sans({
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
});

export const LayoutComponent = ({ children }: { children: ReactNode }) => {
	const fetch = useFetch();

	const { backendUrl, billingEnabled, isGeneral } = useVariables();

	// Feedback icon component attaches Sentry feedback to a top-bar icon when DSN is present
	const searchParams = useSearchParams();
	const load = useCallback(async (path: string) => {
		return await (await fetch(path)).json();
	}, []);
	const { data: user, mutate } = useSWR("/user/self", load, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		revalidateIfStale: false,
		refreshWhenOffline: false,
		refreshWhenHidden: false,
	});

	if (!user) return null;

	return (
		<ContextWrapper user={user}>
			<CopilotKit
				credentials="include"
				runtimeUrl={backendUrl + "/copilot/chat"}
				showDevConsole={false}
			>
				<MantineWrapper>
					<InteractiveBackground />
					<ToolTip />
					<Toaster />
					<CheckPayment check={searchParams.get("check") || ""} mutate={mutate}>
						<ShowMediaBoxModal />
						<ShowLinkedinCompany />
						<MediaSettingsLayout />
						<ShowPostSelector />
						<PreConditionComponent />
						<NewSubscription />
						<ContinueProvider />
						<div
							className={clsx(
								"flex flex-col min-h-screen min-w-screen text-newTextColor p-[12px] bg-newBgColor",
								jakartaSans.className,
							)}
						>
							<div>{user?.admin ? <Impersonate /> : <div />}</div>
							{user.tier === "FREE" && isGeneral && billingEnabled ? (
								<FirstBillingComponent />
							) : (
								<div className="flex-1 flex gap-[16px] max-w-[1920px] mx-auto w-full">
									<Support />
									{/* Sidebar */}
									<div className="flex flex-col bg-newBgColorInner w-[90px] rounded-2xl shadow-sm border border-tableBorder relative z-10">
										<div
											className={clsx(
												"fixed h-[calc(100vh-24px)] w-[90px] flex flex-col",
												user?.admin && "pt-[60px] max-h-[1000px]:w-[500px]",
											)}
										>
											<div className="flex flex-col h-full gap-[40px] flex-1 py-[24px] px-[12px] items-center">
												<Logo />
												<TopMenu />
											</div>
										</div>
									</div>

									{/* Main Content Area */}
									<div className="flex-1 rounded-2xl overflow-hidden flex flex-col gap-[16px] blurMe min-w-0">
										{/* Top Navigation Bar */}
										<div className="flex bg-newBgColorInner h-[72px] px-[24px] items-center rounded-2xl shadow-sm border border-tableBorder">
											<div className="flex flex-1">
												<Title />
											</div>

											{/* Top Right Actions */}
											<div className="flex gap-[12px] items-center text-textItemBlur">
												<StreakComponent />
												<div className="w-[1px] h-[24px] bg-blockSeparator hidden sm:block mx-1" />
												<OrganizationSelector />
												<ModeComponent />
												<LanguageComponent />
												<ChromeExtensionComponent />
												<AttachToFeedbackIcon />
												<NotificationComponent />
											</div>
										</div>

										{/* Page Content */}
										<div className="flex flex-1 rounded-2xl bg-newBgColorInner shadow-sm border border-tableBorder overflow-hidden">
											{children}
										</div>

										{/* Subtle Attribution Footer */}
										<footer className="flex items-center justify-end gap-2 px-2 text-[11px] text-textItemBlur/70">
											<span>
												PostPilot by{" "}
												<a
													href="https://coraxcolab.com"
													target="_blank"
													rel="noopener noreferrer"
													className="hover:text-newTextColor transition-colors underline-offset-2 hover:underline"
												>
													Corax CoLAB
												</a>
											</span>
											<span aria-hidden="true">·</span>
											<span>
												Developed by{" "}
												<a
													href="https://github.com/PelleNybe"
													target="_blank"
													rel="noopener noreferrer"
													className="hover:text-newTextColor transition-colors underline-offset-2 hover:underline"
												>
													Pelle
												</a>
											</span>
											<span aria-hidden="true">·</span>
											<a
												href="https://buymeacoffee.com/pellenybe"
												target="_blank"
												rel="noopener noreferrer"
												className="hover:text-newTextColor transition-colors underline-offset-2 hover:underline"
											>
												Sponsor
											</a>
										</footer>
									</div>
								</div>
							)}
						</div>
					</CheckPayment>
				</MantineWrapper>
			</CopilotKit>
		</ContextWrapper>
	);
};
