"use client";

import { useT } from "@postpilot/react/translation/get.transation.service.client";
import Link from "next/link";

export const ChromeExtensionComponent = () => {
	const t = useT();

	return (
		<Link
			href="/third-party/extension"
			className="select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-btnPrimary focus:outline-none rounded-full p-2 hover:bg-boxFocused text-textItemBlur hover:text-textItemFocused transition-all duration-200"
			aria-label={t("chrome_extension", "Chrome Extension")}
			title={t("chrome_extension", "Chrome Extension")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<circle cx="12" cy="12" r="4"></circle>
				<line x1="21.17" x2="12" y1="8" y2="8"></line>
				<line x1="3.95" x2="8.54" y1="6.06" y2="14"></line>
				<line x1="10.88" x2="15.46" y1="21.94" y2="14"></line>
			</svg>
		</Link>
	);
};
