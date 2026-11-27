"use client";

import EventEmitter from "events";
import { useCallback, useEffect, useState } from "react";
import useCookie from "react-use-cookie";

export const modeEmitter = new EventEmitter();

const ModeComponent = () => {
	const [mode, setMode] = useCookie("mode", "dark");

	const changeMode = useCallback(() => {
		modeEmitter.emit("mode", mode === "dark" ? "light" : "dark");
		setMode(mode === "dark" ? "light" : "dark");
	}, [mode]);

	useEffect(() => {
		document.body.classList.remove("dark", "light");
		document.body.classList.add(mode);
	}, [mode]);
	return (
		<button
			type="button"
			onClick={changeMode}
			className="select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-btnPrimary focus:outline-none rounded-full p-2 hover:bg-boxFocused text-textItemBlur hover:text-textItemFocused transition-all duration-200"
			aria-label={
				mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
			}
			title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
		>
			{mode === "dark" ? (
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
					<circle cx="12" cy="12" r="4"></circle>
					<path d="M12 2v2"></path>
					<path d="M12 20v2"></path>
					<path d="m4.93 4.93 1.41 1.41"></path>
					<path d="m17.66 17.66 1.41 1.41"></path>
					<path d="M2 12h2"></path>
					<path d="M20 12h2"></path>
					<path d="m6.34 17.66-1.41 1.41"></path>
					<path d="m19.07 4.93-1.41 1.41"></path>
				</svg>
			) : (
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
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
				</svg>
			)}
		</button>
	);
};
export default ModeComponent;
