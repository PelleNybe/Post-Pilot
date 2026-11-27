"use client";

import { StarsAndForks } from "@postpilot/frontend/components/analytics/stars.and.forks";
import { StarsTableComponent } from "@postpilot/frontend/components/analytics/stars.table.component";
import { LoadingComponent } from "@postpilot/frontend/components/layout/loading";
import { useFetch } from "@postpilot/helpers/utils/custom.fetch";
import { type FC, useCallback } from "react";
import useSWR from "swr";
export const AnalyticsComponent: FC = () => {
	const fetch = useFetch();
	const load = useCallback(async (path: string) => {
		return await (await fetch(path)).json();
	}, []);
	const { isLoading: isLoadingAnalytics, data: analytics } = useSWR(
		"/analytics",
		load,
	);
	const { isLoading: isLoadingTrending, data: trending } = useSWR(
		"/analytics/trending",
		load,
	);
	if (isLoadingAnalytics || isLoadingTrending) {
		return <LoadingComponent />;
	}
	return (
		<div className="flex gap-[24px] flex-1">
			<div className="flex flex-col gap-[24px] flex-1">
				<StarsAndForks list={analytics} trending={trending} />
				<StarsTableComponent />
			</div>
		</div>
	);
};
