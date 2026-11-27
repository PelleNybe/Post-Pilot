"use client";

import { CopilotPopup } from "@copilotkit/react-ui";
import { DatePicker } from "@postpilot/frontend/components/launches/helpers/date.picker";
import { useExistingData } from "@postpilot/frontend/components/launches/helpers/use.existing.data";
import { RepeatComponent } from "@postpilot/frontend/components/launches/repeat.component";
import { SelectCustomer } from "@postpilot/frontend/components/launches/select.customer";
import { TagsComponent } from "@postpilot/frontend/components/launches/tags.component";
import { useModals } from "@postpilot/frontend/components/layout/new-modal";
import type { AddEditModalProps } from "@postpilot/frontend/components/new-launch/add.edit.modal";
import { EditorWrapper } from "@postpilot/frontend/components/new-launch/editor";
import { PicksSocialsComponent } from "@postpilot/frontend/components/new-launch/picks.socials.component";
import { ShowAllProviders } from "@postpilot/frontend/components/new-launch/providers/show.all.providers";
import { SelectCurrent } from "@postpilot/frontend/components/new-launch/select.current";
import { useLaunchStore } from "@postpilot/frontend/components/new-launch/store";
import { useShortlinkPreference } from "@postpilot/frontend/components/settings/shortlink-preference.component";
import {
	ChevronDownIcon,
	CloseIcon,
	DropdownArrowSmallIcon,
	SettingsIcon,
	TrashIcon,
} from "@postpilot/frontend/components/ui/icons";
import { useHasScroll } from "@postpilot/frontend/components/ui/is.scroll.hook";
import { weightedLength } from "@postpilot/helpers/utils/count.length";
import { useFetch } from "@postpilot/helpers/utils/custom.fetch";
import { stripHtmlValidation } from "@postpilot/helpers/utils/strip.html.validation";
import { makeId } from "@postpilot/nestjs-libraries/services/make.is";
import { Button } from "@postpilot/react/form/button";
import { deleteDialog } from "@postpilot/react/helpers/delete.dialog";
import { useToaster } from "@postpilot/react/toaster/toaster";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import clsx from "clsx";
import dayjs from "dayjs";
import { capitalize } from "lodash";
import React, {
	type FC,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useShallow } from "zustand/react/shallow";

function countCharacters(text: string, type: string): number {
	if (type !== "x") {
		return text.length;
	}
	return weightedLength(text);
}

export const ManageModal: FC<AddEditModalProps> = React.memo((props) => {
	const t = useT();
	const fetch = useFetch();
	const ref = useRef(null);
	const existingData = useExistingData();
	const [loading, setLoading] = useState(false);
	const toaster = useToaster();
	const modal = useModals();
	const [showSettings, setShowSettings] = useState(false);
	const { data: shortlinkPreferenceData } = useShortlinkPreference();

	const { addEditSets, mutate, customClose, isGlobalPlatform } = props;

	const {
		selectedIntegrations,
		hide,
		date,
		setDate,
		repeater,
		setRepeater,
		tags,
		setTags,
		integrations,
		setSelectedIntegrations,
		locked,
		current,
		activateExitButton,
		setHide,
	} = useLaunchStore(
		useShallow((state) => ({
			hide: state.hide,
			setHide: state.setHide,
			date: state.date,
			setDate: state.setDate,
			current: state.current,
			repeater: state.repeater,
			setRepeater: state.setRepeater,
			tags: state.tags,
			setTags: state.setTags,
			selectedIntegrations: state.selectedIntegrations,
			integrations: state.integrations,
			setSelectedIntegrations: state.setSelectedIntegrations,
			locked: state.locked,
			activateExitButton: state.activateExitButton,
		})),
	);

	useEffect(() => {
		if (hide) {
			setHide(false);
		}
	}, [hide]);

	const currentIntegrationText = useMemo(() => {
		if (current === "global") {
			return (
				<div className="flex items-center gap-[10px]">
					<div className="relative">
						<SettingsIcon size={15} className="text-white" />
					</div>
					<div>Settings</div>
				</div>
			);
		}

		const currentIntegration = integrations.find((p) => p.id === current)!;

		return (
			<div className="flex items-center gap-[10px]">
				<div className="relative">
					<img loading="lazy"
						src={`/icons/platforms/${currentIntegration.identifier}.png`}
						className="w-[20px] h-[20px] rounded-[4px]"
						alt={currentIntegration.identifier}
					/>
					<SettingsIcon
						size={15}
						className="text-white absolute -end-[5px] -bottom-[5px]"
					/>
				</div>
				<div>
					{currentIntegration.name} {t("channel_settings", "Settings")}
				</div>
			</div>
		);
	}, [current]);

	const changeCustomer = useCallback(
		(customer: string) => {
			const neededIntegrations = integrations.filter(
				(p) => p?.customer?.id === customer,
			);
			setSelectedIntegrations(
				neededIntegrations.map((p) => ({
					settings: {},
					selectedIntegrations: p,
				})),
			);
		},
		[integrations],
	);

	const askClose = useCallback(async () => {
		if (!activateExitButton || isGlobalPlatform) {
			return;
		}

		if (
			await deleteDialog(
				t(
					"are_you_sure_you_want_to_close_this_modal_all_data_will_be_lost",
					"Are you sure you want to close this modal? (all data will be lost)",
				),
				t("yes_close_it", "Yes, close it!"),
			)
		) {
			if (customClose) {
				customClose();
				return;
			}
			modal.closeAll();
		}
	}, [activateExitButton, isGlobalPlatform]);

	const deletePost = useCallback(async () => {
		setLoading(true);
		if (
			!(await deleteDialog(
				t(
					"are_you_sure_you_want_to_delete_post",
					"Are you sure you want to delete this post?",
				),
				t("yes_delete_it", "Yes, delete it!"),
			))
		) {
			setLoading(false);
			return;
		}
		await fetch(`/posts/${existingData.group}`, {
			method: "DELETE",
		});
		mutate();
		modal.closeAll();
		return;
	}, [existingData, mutate, modal]);

	const schedule = useCallback(
		(type: "draft" | "now" | "schedule" | "update" | "needs-approval") =>
			async () => {
				if (
					(type === "now" || type === "schedule") &&
					(existingData?.posts?.[0]?.state === "PUBLISHED" ||
						(existingData?.posts?.[0]?.state === "QUEUE" &&
							dayjs().isAfter(date.utc())))
				) {
					const userAction = await new Promise((resolve) => {
						modal.openModal({
							title: "What do you want to do?",
							children: (
								<div className="flex flex-col">
									<div className="text-[20px] mb-[20px]">
										This post was already published, what do you want to do?
									</div>
									<div className="flex w-full gap-[10px]">
										<div className="flex-1 flex">
											<Button
												type="button"
												className="flex-1"
												onClick={() => resolve("update")}
											>
												Just update the post details
											</Button>
										</div>
										<div className="flex-1 flex">
											<Button
												type="button"
												className="flex-1"
												onClick={() => resolve("republish")}
											>
												Republish the post
											</Button>
										</div>
									</div>
								</div>
							),
						});
					});

					if (userAction === "update") {
						type = "update";
					}
				}

				setLoading(true);
				const checkAllValid = await ref.current.checkAllValid();

				const notEnoughChars = checkAllValid.filter((p: any) => {
					return p.values.some((a: any) => {
						return (
							countCharacters(
								stripHtmlValidation("normal", a.content, true),
								p?.integration?.identifier || "",
							) === 0 && a.media?.length === 0
						);
					});
				});

				for (const item of notEnoughChars) {
					toaster.show(
						`${capitalize(item.integration.identifier.split("-")[0])} (${
							item.integration.name
						}):` +
							" " +
							t(
								"post_needs_content_or_image",
								"Your post should have at least one character or one image.",
							),
						"warning",
					);
					setLoading(false);
					item.preview();
					return;
				}

				if (type !== "draft") {
					for (const item of checkAllValid) {
						if (item.valid === false) {
							toaster.show(
								`${capitalize(item.integration.identifier.split("-")[0])} (${
									item.integration.name
								}): ${t("please_fix_your_settings", "Please fix your settings")}`,
								"warning",
							);
							item.fix();
							setLoading(false);
							setShowSettings(true);
							return;
						}

						if (item.errors !== true) {
							toaster.show(
								`${capitalize(item.integration.identifier.split("-")[0])} (${
									item.integration.name
								}): ${item.errors}`,
								"warning",
							);
							item.preview();
							setLoading(false);
							setShowSettings(false);
							return;
						}
					}

					const sliceNeeded = checkAllValid.filter((p: any) => {
						return p.values.some((a: any) => {
							const strip = stripHtmlValidation("normal", a.content, true);
							const weightedLength = countCharacters(
								strip,
								p?.integration?.identifier || "",
							);
							const totalCharacters =
								weightedLength > strip.length ? weightedLength : strip.length;

							return totalCharacters > (p.maximumCharacters || 1000000);
						});
					});

					for (const item of sliceNeeded) {
						toaster.show(
							`${item?.integration?.name} (${item?.integration?.identifier}) ${t(
								"post_is_too_long",
								"post is too long, please fix it",
							)}`,
							"warning",
						);
						item.preview();
						setLoading(false);
						return;
					}
				}

				const shortlinkPreference = shortlinkPreferenceData?.shortlink || "ASK";

				let shortLink = false;

				if (!isGlobalPlatform && shortlinkPreference !== "NO") {
					const shortLinkUrl = await (
						await fetch("/posts/should-shortlink", {
							method: "POST",
							body: JSON.stringify({
								messages: checkAllValid.flatMap((p: any) =>
									p.values.flatMap((a: any) => a.content),
								),
							}),
						})
					).json();

					if (shortLinkUrl.ask) {
						if (shortlinkPreference === "YES") {
							// Automatically shortlink without asking
							shortLink = true;
						} else {
							// ASK: Show the dialog
							shortLink = await deleteDialog(
								t(
									"shortlink_urls_question",
									"Do you want to shortlink the URLs? it will let you get statistics over clicks",
								),
								t("yes_shortlink_it", "Yes, shortlink it!"),
							);
						}
					}
				}

				const group = existingData.group || makeId(10);
				const data = {
					type,
					...(repeater ? { inter: repeater } : {}),
					tags,
					shortLink,
					date: date.utc().format("YYYY-MM-DDTHH:mm:ss"),
					posts: checkAllValid.map((post: any) => ({
						integration: {
							id: post.integration.id,
						},
						group,
						settings: { ...(post.settings || {}) },
						value: post.values.map((value: any) => ({
							...(value.id ? { id: value.id } : {}),
							content: value.content,
							delay: value.delay || 0,
							image:
								(value?.media || []).map(
									({ id, path, alt, thumbnail, thumbnailTimestamp }: any) => ({
										id,
										path,
										alt,
										thumbnail,
										thumbnailTimestamp,
									}),
								) || [],
						})),
					})),
				};

				if (isGlobalPlatform) {
					/* handled via postMessage or extension */ setLoading(false);
				}

				if (!isGlobalPlatform) {
					addEditSets
						? addEditSets(data)
						: await fetch("/posts", {
								method: "POST",
								body: JSON.stringify(data),
							});

					if (!addEditSets) {
						mutate();
						toaster.show(
							!existingData.integration
								? t("added_successfully", "Added successfully")
								: t("updated_successfully", "Updated successfully"),
						);
					}
					if (customClose) {
						setTimeout(() => {
							customClose();
						}, 2000);
					}

					if (!addEditSets) {
						modal.closeAll();
					}
				}
			},
		[
			ref,
			repeater,
			tags,
			date,
			addEditSets,
			isGlobalPlatform,
			shortlinkPreferenceData,
		],
	);

	return (
		<div className="w-full h-full flex-1 p-[40px] flex relative">
			<div className="flex flex-1 bg-newBgColorInner rounded-[20px] flex-col">
				<div className="flex-1 flex">
					<div className="flex flex-col flex-1 border-e border-newBorder">
						<div className="bg-newBgColor h-[65px] rounded-s-[20px] !rounded-b-[0] flex items-center px-[20px] text-[20px] font-[600]">
							{t("create_post_title", "Create Post")}
						</div>
						<div className="flex-1 flex flex-col gap-[16px]">
							<div
								className={clsx("flex-1 relative", showSettings && "hidden")}
							>
								<div
									id="social-content"
									className="gap-[32px] flex flex-col pe-[8px] pt-[20px] ps-[20px] absolute top-0 left-0 w-full h-full overflow-x-hidden overflow-y-scroll scrollbar scrollbar-thumb-newColColor scrollbar-track-newBgColorInner"
								>
									<div className="flex w-full">
										<div className="flex flex-1">
											<PicksSocialsComponent toolTip={true} />
										</div>
										<div>
											{!isGlobalPlatform && (
												<SelectCustomer
													onChange={changeCustomer}
													integrations={integrations}
												/>
											)}
										</div>
									</div>
									<div className="flex flex-1 gap-[6px] flex-col">
										<div>{!existingData.integration && <SelectCurrent />}</div>
										<div className="flex-1 flex">
											{!hide && <EditorWrapper totalPosts={1} value="" />}
										</div>
										<div
											id="social-empty"
											className={clsx(
												"pb-[16px]",
												// current !== 'global' && 'hidden'
											)}
										/>
									</div>
								</div>
							</div>
							<div
								id="wrapper-settings"
								className={clsx(
									"pb-[20px] px-[20px] select-none",
									showSettings && "flex-1 flex pt-[20px]",
									current === "global" && "hidden",
								)}
							>
								<div className="flex-1 flex flex-col rounded-[12px] gap-[12px] overflow-hidden bg-newSettings">
									<div
										onClick={() => setShowSettings(!showSettings)}
										className={clsx(
											"bg-[#612BD3] rounded-[12px] flex items-center gap-[8px] cursor-pointer p-[12px]",
											showSettings ? "!rounded-b-none" : "",
										)}
									>
										<div className="flex-1 text-[14px] font-[600] text-white">
											{currentIntegrationText}
										</div>
										<div>
											<ChevronDownIcon
												rotated={showSettings}
												className="text-white"
											/>
										</div>
									</div>
									<div
										className={clsx(
											!showSettings ? "hidden" : "flex-1",
											"text-[14px] text-textColor font-[500] relative",
										)}
									>
										<div className="absolute left-0 top-0 w-full h-full flex flex-col overflow-x-hidden overflow-y-auto scrollbar scrollbar-thumb-newBgColorInner scrollbar-track-newColColor">
											<div
												id="social-settings"
												className="flex flex-col gap-[20px] bg-newBgColor"
											/>
										</div>
									</div>
									<style>
										{`#social-settings [data-id="${current}"] {display: block !important;}`}
									</style>
								</div>
							</div>
						</div>
					</div>
					<div className="w-[580px] flex flex-col">
						<div className="bg-newBgColor h-[65px] rounded-e-[20px] !rounded-b-[0] flex items-center px-[20px] text-[20px] font-[600]">
							<div className="flex-1">{t("post_preview", "Post Preview")}</div>
							<div className="cursor-pointer">
								<CloseIcon onClick={askClose} className="text-[#A3A3A3]" />
							</div>
						</div>
						<div className="flex-1 relative">
							<Scrollable
								scrollClasses="!pe-[20px]"
								className="absolute top-0 p-[20px] pe-[8px] left-0 w-full h-full overflow-x-hidden overflow-y-scroll scrollbar scrollbar-thumb-newColColor scrollbar-track-newBgColorInner"
							>
								<ShowAllProviders ref={ref} />
							</Scrollable>
						</div>
					</div>
				</div>
				<div className="select-none h-[84px] py-[20px] border-t border-newBorder flex items-center">
					<div className="flex-1 flex ps-[20px] gap-[8px]">
						{!isGlobalPlatform && (
							<TagsComponent
								name="tags"
								label={t("tags", "Tags")}
								initial={tags}
								onChange={(e) => {
									setTags(e.target.value);
								}}
							/>
						)}

						{!isGlobalPlatform && (
							<RepeatComponent repeat={repeater} onChange={setRepeater} />
						)}
					</div>
					<div className="pe-[20px] flex items-center justify-end gap-[8px]">
						{existingData?.integration && (
							<button
								aria-label="Delete Post"
								onClick={deletePost}
								className="cursor-pointer flex text-[#FF3F3F] gap-[8px] items-center text-[15px] font-[600]"
							>
								<div>
									<TrashIcon />
								</div>
								<div>{t("delete_post", "Delete Post")}</div>
							</button>
						)}
						<DatePicker onChange={setDate} date={date} />

						{existingData?.posts?.[0]?.state === "NEEDS_APPROVAL" && (
							<button
								aria-label="Approve Post"
								disabled={loading || locked}
								className="relative bg-green-500 min-w-[180px] text-white text-[15px] font-[600] disabled:cursor-not-allowed disabled:opacity-80 outline-none gap-[8px] flex justify-center items-center h-[44px] rounded-[8px] ps-[20px] pe-[16px]"
								onClick={async () => {
									setLoading(true);
									try {
										const load = await fetch(
											`/posts/${existingData.posts[0].id}/approve`,
											{ method: "POST" },
										);
										await load.json();
										mutate();
										modal.closeAll();
									} catch (_e) {
										toaster.show("Error approving post", "warning");
									}
									setLoading(false);
								}}
							>
								{loading && (
									<div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
										<div className="animate-spin h-[20px] w-[20px] border-4 border-white border-t-transparent rounded-full" />
									</div>
								)}
								<div className={clsx(loading && "invisible")}>
									{t("approve_post", "Approve Post")}
								</div>
							</button>
						)}
						{!addEditSets && (
							<button
								aria-label="Save as Draft"
								disabled={
									selectedIntegrations.length === 0 || loading || locked
								}
								onClick={schedule("draft")}
							>
								{t("save_as_draft", "Save as Draft")}
							</button>
						)}
						{!addEditSets && (
							<button
								aria-label="Request Approval"
								disabled={
									selectedIntegrations.length === 0 || loading || locked
								}
								className="relative bg-yellow-500 min-w-[180px] text-white text-[15px] font-[600] disabled:cursor-not-allowed disabled:opacity-80 outline-none gap-[8px] flex justify-center items-center h-[44px] rounded-[8px] ps-[20px] pe-[16px]"
								onClick={schedule("needs-approval")}
							>
								{loading && (
									<div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
										<div className="animate-spin h-[20px] w-[20px] border-4 border-white border-t-transparent rounded-full" />
									</div>
								)}
								<div className={clsx(loading && "invisible")}>
									{t("request_approval", "Request Approval")}
								</div>
							</button>
						)}
						{addEditSets && (
							<button
								aria-label="Save Set"
								className="text-white text-[15px] font-[600] min-w-[180px] btnSub disabled:cursor-not-allowed disabled:opacity-80 outline-none gap-[8px] flex justify-center items-center h-[44px] rounded-[8px] bg-[#612BD3] ps-[20px] pe-[16px]"
								disabled={
									selectedIntegrations.length === 0 || loading || locked
								}
								onClick={schedule("draft")}
							>
								{loading && (
									<div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
										<div className="animate-spin h-[20px] w-[20px] border-4 border-textColor border-t-transparent rounded-full" />
									</div>
								)}
								<div className={clsx(loading && "invisible")}>
									{t("save_as_draft", "Save as Draft")}
								</div>
							</button>
						)}
						{addEditSets && (
							<button
								aria-label="Save Set"
								className="text-white text-[15px] font-[600] min-w-[180px] btnSub disabled:cursor-not-allowed disabled:opacity-80 outline-none gap-[8px] flex justify-center items-center h-[44px] rounded-[8px] bg-[#612BD3] ps-[20px] pe-[16px]"
								disabled={
									selectedIntegrations.length === 0 || loading || locked
								}
								onClick={schedule("draft")}
							>
								Save Set
							</button>
						)}
						{!addEditSets && (
							<div className="group cursor-pointer relative">
								<button
									aria-label={existingData?.integration ? "Update Post" : "Schedule Post"}
									disabled={
										selectedIntegrations.length === 0 || loading || locked
									}
									onClick={schedule("schedule")}
									className="text-white relative min-w-[180px] btnSub disabled:cursor-not-allowed disabled:opacity-80 outline-none gap-[8px] flex justify-center items-center h-[44px] rounded-[8px] bg-[#612BD3] ps-[20px] pe-[16px]"
								>
									{loading && (
										<div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
											<div className="animate-spin h-[20px] w-[20px] border-4 border-white border-t-transparent rounded-full" />
										</div>
									)}
									<div
										className={clsx(
											"text-[15px] font-[600]",
											loading && "invisible",
										)}
									>
										{selectedIntegrations.length === 0
											? t("check_circles_above", "Check the circles above")
											: isGlobalPlatform
												? t("create_output", "Create output")
												: !existingData?.integration
													? t("add_to_calendar", "Add to calendar")
													: existingData?.posts?.[0]?.state === "DRAFT"
														? t("schedule", "Schedule")
														: t("update", "Update")}
									</div>
									{!isGlobalPlatform && (
										<div className="flex justify-center items-center h-[20px] w-[20px] pt-[4px] arrow-change">
											<DropdownArrowSmallIcon className="group-hover:rotate-180 text-white" />
										</div>
									)}
								</button>

								{!isGlobalPlatform && (
									<button
										aria-label="Post Now"
										onClick={schedule("now")}
										disabled={
											selectedIntegrations.length === 0 || loading || locked
										}
										className="rounded-[8px] z-[300] disabled:cursor-not-allowed disabled:opacity-80 hidden group-hover:flex absolute bottom-[100%] -left-[12px] p-[12px] w-[206px] bg-newBgColorInner"
									>
										<div className="text-white rounded-[8px] bg-[#D82D7E] h-[44px] w-full flex justify-center items-center post-now">
											{t("post_now", "Post Now")}
										</div>
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
			<CopilotPopup
				hitEscapeToClose={false}
				clickOutsideToClose={true}
				instructions={`
You are an assistant that help the user to schedule their social media posts,
Here are the things you can do:
- Add a new comment / post to the list of posts
- Delete a comment / post from the list of posts
- Add content to the comment / post
- Activate or deactivate the comment / post

Post content can be added using the addPostContentFor{num} function.
After using the addPostFor{num} it will create a new addPostContentFor{num+ 1} function.
`}
				labels={{
					title: t("your_assistant", "Your Assistant"),
					initial: t(
						"assistant_initial_message",
						"Hi! I can help you to refine your social media posts.",
					),
				}}
			/>
		</div>
	);
});

const Scrollable: FC<{
	className: string;
	scrollClasses: string;
	children: ReactNode;
}> = React.memo(({ className, scrollClasses, children }) => {
	const ref = useRef();
	const hasScroll = useHasScroll(ref);
	return (
		<div className={clsx(className, hasScroll && scrollClasses)} ref={ref}>
			{children}
		</div>
	);
});
