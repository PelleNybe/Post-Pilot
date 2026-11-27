import { useClickOutside } from "@mantine/hooks";
import { useUser } from "@postpilot/frontend/components/layout/user.context";
import { useFetch } from "@postpilot/helpers/utils/custom.fetch";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import type { Notifications as Notification } from "@prisma/client";
import clsx from "clsx";
import React, {
	type FC,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import ReactLoading from "react-loading";
import useSWR from "swr";

const SingleNotification: FC<{ notification: Notification }> = ({
	notification,
}) => {
	const user = useUser();
	const newNotification = useMemo(() => {
		if ((user as any)?.lastNotificationRead) {
			return (
				new Date((user as any).lastNotificationRead).getTime() <
				new Date(notification.createdAt).getTime()
			);
		}
		return true;
	}, [user, notification]);

	const content = useMemo(() => {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		const parts = notification.content.split(urlRegex);

		return parts.map((part, index) => {
			if (urlRegex.test(part)) {
				return (
					<a
						key={index}
						className="cursor-pointer underline font-bold text-btnPrimary hover:text-btnPrimary/80"
						target="_blank"
						rel="noopener noreferrer"
						href={part}
					>
						{part}
					</a>
				);
			}
			return part;
		});
	}, [notification.content]);

	return (
		<div
			className={clsx(
				`text-newTextColor px-[16px] py-[14px] border-b border-tableBorder last:border-b-0 transition-colors overflow-hidden text-ellipsis hover:bg-boxFocused`,
				newNotification && "bg-boxFocused border-l-4 border-l-btnPrimary",
			)}
		>
			<div className="text-sm leading-relaxed">{content}</div>
			<div className="text-[11px] text-textItemBlur mt-1">
				{new Date(notification.createdAt).toLocaleDateString()}
			</div>
		</div>
	);
};
export const NotificationOpenComponent = () => {
	const fetch = useFetch();
	const loadNotifications = useCallback(async () => {
		return await (await fetch("/notifications/list")).json();
	}, []);
	const t = useT();

	const { data, isLoading } = useSWR("notifications", loadNotifications);
	return (
		<div
			id="notification-popup"
			className="opacity-0 animate-normalFadeDown mt-[12px] absolute w-[380px] min-h-[200px] max-h-[400px] overflow-y-auto top-[100%] end-0 bg-newBgColorInner text-newTextColor rounded-2xl flex flex-col shadow-menu border border-tableBorder z-[600] scrollbar-thin scrollbar-thumb-fifth scrollbar-track-transparent"
		>
			<div
				className={`p-[16px] border-b border-tableBorder font-bold sticky top-0 bg-newBgColorInner/90 backdrop-blur-sm z-10`}
			>
				{t("notifications", "Notifications")}
			</div>

			<div className="flex flex-col">
				{isLoading && (
					<div className="flex-1 flex justify-center py-12">
						<ReactLoading
							type="spin"
							color="var(--new-btn-primary)"
							width={32}
							height={32}
						/>
					</div>
				)}
				{!isLoading && !data.notifications.length && (
					<div className="text-center p-[24px] text-textItemBlur flex-1 flex flex-col justify-center items-center mt-[20px] gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
							<path d="M22 8c0-2.3-.8-4.3-2-6"></path>
							<path d="M3.262 15.326A18 18 0 0 1 12 17a18 18 0 0 1 8.738-1.674"></path>
							<path d="M2 8c0-2.3.8-4.3 2-6"></path>
							<path d="m22 2-20 20"></path>
						</svg>
						<div>{t("no_notifications", "No notifications")}</div>
					</div>
				)}
				{!isLoading &&
					data.notifications.map((notification: any) => (
						<SingleNotification
							key={notification.id}
							notification={notification}
						/>
					))}
			</div>
		</div>
	);
};

export default function NotificationComponent() {
	const [show, setShow] = useState(false);
	const fetch = useFetch();
	const loadNotificationsTotal = useCallback(async () => {
		return await (await fetch("/notifications")).json();
	}, []);

	const { data, isLoading } = useSWR(
		"notifications-list",
		loadNotificationsTotal,
		{
			refreshInterval: 1000 * 60, // check for notifications every minute
		},
	);



	const close = useCallback((e?: any) => {
		// Check if the click is inside the popup
		if (e?.target?.closest("#notification-popup")) {
			return;
		}
		setShow(false);
	}, []);

	const ref = useClickOutside(() => close(null));

	const changeShow = useCallback(
		async (e: any) => {
			e.stopPropagation();
			e.preventDefault();
			if (!show && data?.total > 0) {
				await fetch("/notifications/read", {
					method: "POST",
				});
				data.total = 0;
			}
			setShow(!show);
		},
		[show, data],
	);

	if (isLoading) return null;

	return (
		<div className="relative select-none" ref={ref}>
			<div
				onClick={changeShow}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						changeShow(e);
					}
				}}
				className="rounded-full p-2 hover:bg-boxFocused text-textItemBlur hover:text-textItemFocused transition-all duration-200 focus-visible:ring-2 focus-visible:ring-btnPrimary focus:outline-none cursor-pointer"
				aria-label="Notifications"
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
					<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
					<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
				</svg>
				{data && data.total > 0 && (
					<span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-btnPrimary opacity-75"></span>
						<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-btnPrimary border border-newBgColorInner"></span>
					</span>
				)}
			</div>
			{show && <NotificationOpenComponent />}
		</div>
	);
}
