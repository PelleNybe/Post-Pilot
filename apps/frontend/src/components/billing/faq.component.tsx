"use client";

import { SafeHtml } from "@postpilot/frontend/components/helpers/safe.html";

import { useUser } from "@postpilot/frontend/components/layout/user.context";
import { useVariables } from "@postpilot/react/helpers/variable.context";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import { type FC, useCallback, useState } from "react";

const useFaqList = () => {
	const { isGeneral } = useVariables();
	const user = useUser();
	const t = useT();
	return [
		...(user?.allowTrial
			? [
					{
						title: t(
							"faq_am_i_going_to_be_charged_by_postpilot",
							"Am I going to be charged by PostPilot?",
						),
						description: t(
							"faq_to_confirm_credit_card_information_postpilot_will_hold",
							"To confirm credit card information PostPilot will hold $2 and release it immediately, you can cancel your subscription anytime from settings without talking to a person",
						),
					},
				]
			: []),
		{
			title: t(
				"faq_can_i_trust_postpilot_postpilot",
				`Can I trust ${isGeneral ? "PostPilot" : "PostPilot"}?`,
			),
			description: t(
				"faq_postpilot_postpilot_is_proudly_open_source",
				`${
					isGeneral ? "PostPilot" : "PostPilot"
				} is proudly open-source! We believe in an ethical and transparent culture, meaning that ${
					isGeneral ? "PostPilot" : "PostPilot"
				} will live forever. You can check out the entire code or use it for personal projects. To view the open-source repository, <a href="https://github.com/PelleNybe/Post-Pilot" target="_blank" rel="noopener noreferrer" style="text-decoration: underline;">click here</a>.`,
			),
		},
		{
			title: t("faq_what_are_channels", "What are channels?"),
			description: t(
				"faq_postpilot_postpilot_allows_you_to_schedule_posts",
				`${
					isGeneral ? "PostPilot" : "PostPilot"
				} allows you to schedule your posts between different channels.
A channel is a publishing platform where you can schedule your posts.
For example, you can schedule your posts on X, Facebook, Instagram, TikTok, YouTube, Reddit, Linkedin, Dribbble, Threads and Pinterest.`,
			),
		},
		{
			title: t("faq_what_are_team_members", "What are team members?"),
			description: t(
				"faq_if_you_have_a_team_with_multiple_members",
				"If you have a team with multiple members, you can invite them to your workspace to collaborate on your posts and add their personal channels",
			),
		},
	];
};
export const FAQSection: FC<{
	title: string;
	description: string;
}> = (props) => {
	const { title, description } = props;
	const [show, setShow] = useState(false);
	const _changeShow = useCallback(() => {
		setShow((prev) => !prev);
	}, []);
	return (
		<div className="border-b border-tableBorder pb-[16px] max-w-[450px]">
			<div
				onClick={(e) => {
					e.stopPropagation();
					_changeShow();
				}}
				role="button"
				tabIndex={0}
				aria-expanded={show}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						_changeShow();
					}
				}}
				className="flex items-center justify-between gap-[12px] cursor-pointer font-[600] text-[16px] text-textColor"
			>
				<span>{title}</span>
				<span className="text-[18px] leading-none">{show ? "−" : "+"}</span>
			</div>
			{show && (
				<div className="mt-[12px] w-full text-wrap font-[400] text-[15px] text-customColor17 select-text">
					<SafeHtml html={description} />
				</div>
			)}
		</div>
	);
};
export const FAQComponent: FC = () => {
	const list = useFaqList();
	return (
		<div>
			{/*<h3 className="text-[24px] mt-[48px] mb-[40px] tablet:mt-[80px]">*/}
			{/*  {t('frequently_asked_questions', 'Frequently Asked Questions')}*/}
			{/*</h3>*/}
			<div className="gap-[24px] flex-col flex select-none  mt-[48px] mb-[40px] tablet:mt-[80px]">
				{list.map((item, index) => (
					<FAQSection key={index} {...item} />
				))}
			</div>
		</div>
	);
};
