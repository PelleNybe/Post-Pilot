import { useUser } from "@postpilot/frontend/components/layout/user.context";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import clsx from "clsx";
import { useMemo } from "react";

export const StreakComponent = () => {
	const t = useT();
	const user = useUser();

	const streak = useMemo(() => {
		if (!user) return 0;
		return (user as any).streak || 0;
	}, [user]);

	if (streak === 0) return null;

	return (
		<div
			className={clsx(
				"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all duration-300",
				streak > 0
					? "bg-orange-500/10 text-orange-500 border-orange-500/20"
					: "bg-boxFocused text-textItemBlur border-tableBorder",
			)}
			title={t("current_streak", "Current Streak")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill={streak > 0 ? "currentColor" : "none"}
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className={streak > 0 ? "text-orange-500" : ""}
			>
				<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
			</svg>
			<span>{streak}</span>
		</div>
	);
};
