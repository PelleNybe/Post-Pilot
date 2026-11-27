"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { type FC, type ReactNode } from "react";

export const MenuItem: FC<{
	label: string;
	icon: ReactNode;
	path: string;
	onClick?: () => void;
}> = React.memo(({ label, icon, path, onClick }) => {
	const currentPath = usePathname();
	const isActive = currentPath.indexOf(path) === 0;

	const className = clsx(
		"w-full minCustom:h-[58px] custom:h-[36px] py-[8px] px-[8px] gap-[6px] flex flex-col custom:flex-row text-[11px] font-[600] items-center minCustom:justify-center rounded-[12px] transition-colors duration-200 ease-in-out",
		isActive
			? "text-textItemFocused bg-boxFocused shadow-sm"
			: "text-textItemBlur hover:text-textItemFocused hover:bg-boxFocused",
	);

	if (onClick) {
		return (
			<button
				aria-label={label}
				onClick={onClick}
				className={className}
				aria-current={isActive ? "page" : undefined}
			>
				<div
					className={clsx(
						"custom:hidden transition-transform duration-200",
						isActive ? "scale-110" : "group-hover:scale-110",
					)}
					aria-hidden="true"
				>
					{icon}
				</div>
				<div className="text-[10px] sm:text-[11px]">{label}</div>
			</button>
		);
	}

	return (
		<Link
			prefetch={true}
			href={path}
			{...(path.indexOf("http") === 0 && { target: "_blank" })}
			className={className + " group"}
			aria-current={isActive ? "page" : undefined}
		>
			<div
				className={clsx(
					"custom:hidden transition-transform duration-200",
					isActive ? "scale-110" : "group-hover:scale-110",
				)}
				aria-hidden="true"
			>
				{icon}
			</div>
			<div className="text-[10px] sm:text-[11px]">{label}</div>
		</Link>
	);
});
