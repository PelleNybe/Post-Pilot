"use client";

import EmailNotificationsComponent from "@postpilot/frontend/components/settings/email-notifications.component";
import ShortlinkPreferenceComponent from "@postpilot/frontend/components/settings/shortlink-preference.component";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import dynamic from "next/dynamic";
import React from "react";

const MetricComponent = dynamic(
	() => import("@postpilot/frontend/components/settings/metric.component"),
	{
		ssr: false,
	},
);

export const GlobalSettings = () => {
	const t = useT();
	return (
		<div className="flex flex-col">
			<h3 className="text-[20px]">{t("global_settings", "Global Settings")}</h3>
			<MetricComponent />
			<EmailNotificationsComponent />
			<ShortlinkPreferenceComponent />
		</div>
	);
};
