"use client";

import { useModals } from "@postpilot/frontend/components/layout/new-modal";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export const CommandPalette = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const router = useRouter();
	const t = useT();
	const inputRef = useRef<HTMLInputElement>(null);

	useHotkeys(
		"ctrl+k, cmd+k",
		(e) => {
			e.preventDefault();
			setIsOpen(true);
		},
		{ enableOnFormTags: true },
	);

	useHotkeys(
		"esc",
		() => {
			setIsOpen(false);
		},
		{ enableOnFormTags: true },
	);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		} else {
			setSearch("");
		}
	}, [isOpen]);

	const commands = [
		{
			id: "calendar",
			title: t("go_to_calendar", "Go to Calendar"),
			action: () => router.push("/launches"),
		},
		{
			id: "analytics",
			title: t("go_to_analytics", "Go to Analytics"),
			action: () => router.push("/analytics"),
		},
		{
			id: "billing",
			title: t("go_to_billing", "Go to Billing"),
			action: () => router.push("/billing"),
		},
		{
			id: "settings",
			title: t("go_to_settings", "Go to Settings"),
			action: () => router.push("/settings"),
		},
		{
			id: "integrations",
			title: t("add_integration", "Add Channel"),
			action: () => router.push("/launches?add_channel=true"),
		},
	];

	const filteredCommands = commands.filter((c) =>
		c.title.toLowerCase().includes(search.toLowerCase()),
	);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
				onClick={() => setIsOpen(false)}
			/>
			<div className="relative w-full max-w-xl bg-newBgColorInner rounded-2xl shadow-2xl overflow-hidden border border-tableBorder transform transition-all">
				<div className="p-4 border-b border-tableBorder flex items-center gap-3">
					<svg
						className="w-5 h-5 text-textColor/50"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						ref={inputRef}
						type="text"
						className="flex-1 bg-transparent border-none outline-none text-textColor placeholder-textColor/40 text-[16px]"
						placeholder={t("search_commands", "Search commands...")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<kbd className="hidden sm:inline-block px-2 py-1 text-[12px] font-sans bg-boxFocused text-textColor/50 rounded-[4px]">
						ESC
					</kbd>
				</div>
				<div className="max-h-[60vh] overflow-y-auto p-2">
					{filteredCommands.length === 0 ? (
						<div className="p-4 text-center text-textColor/50 text-[14px]">
							{t("no_results_found", "No results found.")}
						</div>
					) : (
						filteredCommands.map((command, idx) => (
							<div
								key={command.id}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										command.action();
										setIsOpen(false);
									}
								}}
								onClick={() => {
									command.action();
									setIsOpen(false);
								}}
								className={clsx(
									"px-4 py-3 rounded-[8px] cursor-pointer flex items-center justify-between group",
									idx === 0
										? "bg-primary text-white"
										: "hover:bg-boxFocused text-textColor",
								)}
							>
								<span className="font-[500] text-[15px]">{command.title}</span>
								<span
									className={clsx(
										"text-[12px]",
										idx === 0
											? "text-white/70"
											: "text-textColor/30 group-hover:text-primary",
									)}
								>
									{t("jump_to", "Jump to")} ↵
								</span>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};
