import { useModals } from "@mantine/modals";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import {
	cookieName,
	fallbackLng,
	languages,
} from "@postpilot/react/translation/i18n.config";
import clsx from "clsx";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import i18next from "i18next";
import { useCallback } from "react";
import ReactCountryFlag from "react-country-flag";
import useCookie from "react-use-cookie";

// Initialize the english language pack for ISO countries mapping
countries.registerLocale(enLocale);

/**
 * A robust mapping function that converts a language code (like "en", "es", "zh")
 * or a locale code (like "en-US") into the corresponding 2-letter ISO country code
 * required by the react-country-flag component.
 *
 * @param languageCode The current language or locale string (e.g. 'en', 'es', 'zh-CN')
 * @returns A 2-letter ISO country code (e.g. 'GB', 'ES', 'CN')
 */
const getCountryCodeForFlag = (languageCode: string): string => {
	if (!languageCode) return "GB"; // Default

	// Handle specific overrides where language != country code
	if (languageCode === "en") return "GB";
	if (languageCode === "es") return "ES";
	if (languageCode === "ar") return "SA";
	if (languageCode === "zh") return "CN";
	if (languageCode === "he") return "IL";
	if (languageCode === "ja") return "JP";
	if (languageCode === "ko") return "KR";
	if (languageCode === "vi") return "VN";

	// Check if language code itself is a valid country code
	try {
		const countryName = countries.getName(languageCode.toUpperCase(), "en");
		if (countryName) {
			return languageCode.toUpperCase();
		}
	} catch (e) {
		// Not a valid country code, continue to next approach
	}

	// Try to extract region code if language code has a region component (e.g., en-US)
	const parts = languageCode.split("-");
	if (parts.length > 1) {
		const regionCode = parts[1].toUpperCase();
		try {
			const countryName = countries.getName(regionCode, "en");
			if (countryName) {
				return regionCode;
			}
		} catch (e) {
			// Not a valid country code, continue to next approach
		}
	}

	// For most language codes that match their primary country
	// Examples: fr->FR, it->IT, de->DE, etc.
	return languageCode.toUpperCase();
};

export const ChangeLanguageComponent = () => {
	const currentLanguage = i18next.resolvedLanguage || fallbackLng;
	const availableLanguages = languages;
	const [_, setCookie] = useCookie(cookieName, currentLanguage || fallbackLng);
	const modals = useModals();
	const t = useT();

	const handleLanguageChange = (language: string) => {
		setCookie(language);
		i18next.changeLanguage(language);
		modals.closeAll();
	};

	// Function to get language name in its native script
	const getLanguageName = useCallback((code: string) => {
		try {
			// Use browser's Intl API to get language name in native script
			const displayNames = new Intl.DisplayNames([code], {
				type: "language",
			});
			return displayNames.of(code);
		} catch (error) {
			// Fallback to language code if the API isn't supported or language is not found
			return code;
		}
	}, []);

	return (
		<div className="relative">
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
				{availableLanguages.map((language) => (
					<div
						className={clsx(
							"flex flex-col items-center justify-center bg-newBgColorInner border hover:border-btnPrimary hover:bg-boxFocused p-4 rounded-xl cursor-pointer gap-3 transition-all duration-200 group",
							language === currentLanguage
								? "border-btnPrimary shadow-sm"
								: "border-tableBorder",
						)}
						key={language}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleLanguageChange(language);
							}
						}}
						onClick={() => handleLanguageChange(language)}
					>
						<div className="rounded-full overflow-hidden w-10 h-10 shadow-sm relative group-hover:scale-110 transition-transform duration-200 border border-tableBorder">
							<ReactCountryFlag
								countryCode={getCountryCodeForFlag(language)}
								svg
								style={{
									width: "100%",
									height: "100%",
									objectFit: "cover",
									position: "absolute",
									top: 0,
									left: 0,
								}}
							/>
						</div>
						<span className="capitalize text-sm font-medium text-newTextColor text-center">
							{getLanguageName(language)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

export const LanguageComponent = () => {
	const currentLanguage = i18next.resolvedLanguage || fallbackLng;
	const modals = useModals();
	const t = useT();

	const openModal = () => {
		modals.openModal({
			title: t("change_language", "Change Language"),
			children: <ChangeLanguageComponent />,
			size: "xl",
			centered: true,
			classNames: {
				modal: "bg-newBgColorInner text-newTextColor rounded-2xl shadow-xl",
				header: "bg-transparent border-b border-tableBorder px-6 py-4",
				title: "text-lg font-semibold",
				close: "hover:bg-boxFocused rounded-full p-1",
				body: "p-2",
			},
		});
	};

	return (
		<div
			role="button"
			tabIndex={0}
			aria-label="Change Language"
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					openModal();
				}
			}}
			onClick={openModal}
			className="rounded-full overflow-hidden h-[24px] w-[24px] relative cursor-pointer focus-visible:ring-2 focus-visible:ring-btnPrimary focus:outline-none hover:scale-110 transition-transform duration-200 border border-tableBorder shadow-sm"
		>
			<ReactCountryFlag
				countryCode={getCountryCodeForFlag(currentLanguage)}
				svg
				style={{
					width: "24px",
					height: "24px",
					position: "absolute",
					left: "50%",
					top: "50%",
					transform: "translate(-50%, -50%)",
					objectFit: "cover",
				}}
			/>
		</div>
	);
};
