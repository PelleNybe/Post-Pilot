import { Button } from "@postpilot/react/form/button";
import { useFetch } from "@postpilot/helpers/utils/custom.fetch";
import { useVariables } from "@postpilot/react/helpers/variable.context";
import { useToaster } from "@postpilot/react/toaster/toaster";
import { useT } from "@postpilot/react/translation/get.transation.service.client";
import { type FC, useCallback, useMemo, useState } from "react";
import { useCalendar as useCalendarWeek } from "./calendar.context";

export const BulkStateActions: FC = () => {
	const t = useT();
	const toaster = useToaster();
	const fetch = useFetch();
	const { posts, reloadCalendarView: mutate } = useCalendarWeek();
	// removed addLoading/removeLoading
	const [selectedState, setSelectedState] = useState<string>("QUEUE");

	// Logic for finding selected posts from calendar context.
	// Assuming we don't have a direct "selected" property in posts, this could act on ALL "NEEDS_APPROVAL" posts, or a user selection state if available.
	// For this implementation, we will act on all posts in the current view that are in "NEEDS_APPROVAL" or "DRAFT".

	const candidatePosts = useMemo(() => {
		return (posts || []).filter(
			(p: { id: string; state: string; [key: string]: any }) =>
				p.state === "NEEDS_APPROVAL" || p.state === "DRAFT",
		);
	}, [posts]);

	const handleBulkAction = useCallback(async () => {
		if (!candidatePosts.length) {
			toaster.show(
				t("no_posts_to_update", "No posts available to update."),
				"warning",
			);
			return;
		}

		const ids = candidatePosts.map(
			(p: { id: string; state: string; [key: string]: any }) => p.id,
		);
		const uniqueIds = Array.from(new Set(ids));


		try {
			const res = await fetch("/posts/bulk-state", {
				method: "PUT",
				body: JSON.stringify({
					ids: uniqueIds,
					state: selectedState,
				}),
			});

			if (res.ok) {
				toaster.show(
					t("bulk_update_success", "Posts updated successfully."),
					"success",
				);
				mutate(); // Refresh calendar
			} else {
				toaster.show(
					t("bulk_update_error", "Failed to update posts."),
					"warning",
				);
			}
		} catch (_e) {
			toaster.show(t("bulk_update_error", "Failed to update posts."), "warning");
		} finally {

		}
	}, [
		candidatePosts,
		fetch,


		toaster,
		mutate,
		selectedState,
		t,
	]);

	if (!candidatePosts.length) {
		return null; // Don't show if there are no candidate posts
	}

	return (
		<div className="flex items-center gap-2 mt-4 pt-4 border-t border-tableBorder">
			<span className="text-sm text-textColor font-medium">
				Bulk Actions ({candidatePosts.length} posts):
			</span>
			<select
				className="bg-newBgColorInner border border-tableBorder rounded px-2 py-1 text-sm text-textColor"
				value={selectedState}
				onChange={(e) => setSelectedState(e.target.value)}
			>
				<option value="QUEUE">Approve (Move to Queue)</option>
				<option value="DRAFT">Move to Draft</option>
				<option value="NEEDS_APPROVAL">Needs Approval</option>
			</select>
			<Button className="text-xs py-1 px-3" onClick={handleBulkAction}>
				Apply
			</Button>
		</div>
	);
};
