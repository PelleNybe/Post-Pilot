"use client";

import { useMenuItem } from "@postpilot/frontend/components/layout/top.menu";
import { usePathname } from "next/navigation";

export const Title = () => {
	const currentPath = usePathname();
	const { all } = useMenuItem();

	const current = all.find((item) => {
		return currentPath.indexOf(item.path) === 0 && item.path !== "/";
	});

	if (!current) {
		return null;
	}

	return (
		<div className="flex items-center gap-3">
			<div className="text-textItemBlur p-2 bg-boxFocused rounded-lg">
				{current.icon}
			</div>
			<span className="text-xl font-bold tracking-tight">{current.name}</span>
		</div>
	);
};
