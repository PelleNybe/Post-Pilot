"use client";

import { useUser } from "@postpilot/frontend/components/layout/user.context";
import { useFetch } from "@postpilot/helpers/utils/custom.fetch";
import clsx from "clsx";
import React, { type FC, useCallback, useMemo } from "react";
import useSWR from "swr";
export const OrganizationSelector: FC<{ asOpenSelect?: boolean }> = ({
	asOpenSelect,
}) => {
	const fetch = useFetch();
	const user = useUser();
	const load = useCallback(async () => {
		return await (await fetch("/user/organizations")).json();
	}, []);
	const { isLoading, data } = useSWR("organizations", load, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		refreshWhenOffline: false,
		refreshWhenHidden: false,
		revalidateOnReconnect: false,
	});
	const changeOrg = useCallback(
		(org: { name: string; id: string }) => async () => {
			await fetch("/user/change-org", {
				method: "POST",
				body: JSON.stringify({
					id: org.id,
				}),
			});
			window.location.reload();
		},
		[],
	);
	if (isLoading || (!isLoading && data?.length === 1)) {
		return null;
	}
	return (
		<>
			<div className="hover:text-newTextColor transition-colors duration-200">
				<div
					className="group text-[12px] relative cursor-pointer focus-visible:ring-2 focus-visible:ring-btnPrimary focus:outline-none rounded-full flex items-center justify-center p-1"
					role="button"
					tabIndex={0}
					aria-label="Select Organization"
				>
					{asOpenSelect && (
						<div className="bg-btnPrimary text-white !flex !relative max-w-[500px] mx-auto py-[12px] px-[24px] rounded-full shadow-md hover:shadow-lg transition-all">
							Select Organization
						</div>
					)}
					{!asOpenSelect && (
						<div className="flex items-center text-textItemBlur group-hover:text-textItemFocused transition-colors duration-200">
							<svg
								className={
									user?.tier.current === "FREE"
										? "animate-bounce drop-shadow-glow"
										: ""
								}
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
								<circle cx="12" cy="7" r="4"></circle>
							</svg>
						</div>
					)}
					{data?.length > 1 && (
						<div
							className={clsx(
								"opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 absolute top-[100%] end-0 mt-2 bg-newBgColorInner border-tableBorder border shadow-menu rounded-xl py-2 min-w-[200px] z-50 flex-col",
								asOpenSelect
									? "!flex !relative max-w-[500px] mx-auto mb-[10px] mt-4 opacity-100 visible"
									: "",
							)}
						>
							<div className="px-4 py-2 text-xs font-semibold text-textItemBlur uppercase tracking-wider border-b border-tableBorder mb-1">
								Switch Workspace
							</div>
							{data?.map((org: { name: string; id: string }) => (
								<div
									key={org.id}
									onClick={changeOrg(org)}
									className={clsx(
										"cursor-pointer px-4 py-2 text-sm flex items-center justify-between hover:bg-boxFocused focus-visible:ring-2 focus-visible:ring-btnPrimary focus:outline-none transition-colors",
										org.id === user?.orgId
											? "text-btnPrimary font-medium bg-boxFocused/50"
											: "text-newTextColor",
									)}
									role="menuitem"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											changeOrg(org)();
										}
									}}
								>
									{org.name}
									{org.id === user?.orgId && (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<polyline points="20 6 9 17 4 12"></polyline>
										</svg>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
			{!asOpenSelect && (
				<div className="w-[1px] h-[20px] bg-blockSeparator hidden sm:block" />
			)}
		</>
	);
};
