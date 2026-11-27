import { Ability, AbilityBuilder, type AbilityClass } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { IntegrationService } from "@postpilot/nestjs-libraries/database/prisma/integrations/integration.service";
import { PostsService } from "@postpilot/nestjs-libraries/database/prisma/posts/posts.service";
import { pricing } from "@postpilot/nestjs-libraries/database/prisma/subscriptions/pricing";
import { SubscriptionService } from "@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service";
import { WebhooksService } from "@postpilot/nestjs-libraries/database/prisma/webhooks/webhooks.service";
import dayjs from "dayjs";
import { AuthorizationActions, Sections } from "./permission.exception.class";

export type AppAbility = Ability<[AuthorizationActions, Sections]>;

@Injectable()
export class PermissionsService {
	constructor(
		private _subscriptionService: SubscriptionService,
		private _postsService: PostsService,
		private _integrationService: IntegrationService,
		private _webhooksService: WebhooksService,
	) {}
	async getPackageOptions(orgId: string) {
		const subscription =
			await this._subscriptionService.getSubscriptionByOrganizationId(orgId);

		const isBillingEnabled = !!process.env.STRIPE_PUBLISHABLE_KEY;
		const tier =
			subscription?.subscriptionTier || (!isBillingEnabled ? "PRO" : "FREE");

		const { channel, ...all } = pricing[tier];
		return {
			subscription,
			options: {
				...all,
				...{ channel: tier === "FREE" ? channel : -10 },
			},
		};
	}

	async check(
		orgId: string,
		_created_at: Date,
		permission: "USER" | "ADMIN" | "SUPERADMIN",
		requestedPermission: Array<[AuthorizationActions, Sections]>,
	) {
		const { can, build } = new AbilityBuilder<
			Ability<[AuthorizationActions, Sections]>
		>(Ability as AbilityClass<AppAbility>);

		if (requestedPermission.length === 0) {
			return build({
				detectSubjectType: (item) =>
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					item.constructor,
			});
		}

		const { subscription, options } = await this.getPackageOptions(orgId);

		const needsChannels = requestedPermission.some(
			([, section]) => section === Sections.CHANNEL,
		);
		const needsWebhooks = requestedPermission.some(
			([, section]) => section === Sections.WEBHOOKS,
		);
		const needsPostsPerMonth = requestedPermission.some(
			([, section]) => section === Sections.POSTS_PER_MONTH,
		);

		const [totalChannels, totalWebhooks, postsCountInfo] = await Promise.all([
			needsChannels
				? this._integrationService
						.getIntegrationsList(orgId)
						.then((f) => f.filter((i) => !i.refreshNeeded).length)
				: Promise.resolve(0),
			needsWebhooks
				? this._webhooksService.getTotal(orgId)
				: Promise.resolve(0),
			needsPostsPerMonth
				? this._subscriptionService
						.getSubscriptionByOrganizationId(orgId)
						.then(async (s) => {
							const createdAt = s?.createdAt || new Date();
							const totalMonthPast = Math.abs(
								dayjs(createdAt).diff(dayjs(), "month"),
							);
							const checkFrom = dayjs(createdAt).add(totalMonthPast, "month");
							const count = await this._postsService.countPostsFromDay(
								orgId,
								checkFrom.toDate(),
							);
							return count;
						})
				: Promise.resolve(0),
		]);

		for (const [action, section] of requestedPermission) {
			// check for the amount of channels
			if (section === Sections.CHANNEL) {
				if (
					(options.channel && options.channel > totalChannels) ||
					(subscription?.totalChannels || 0) > totalChannels
				) {
					can(action, section);
					continue;
				}
			}

			if (section === Sections.WEBHOOKS) {
				if (totalWebhooks < options.webhooks) {
					can(AuthorizationActions.Create, section);
					continue;
				}
			}

			// check for posts per month
			if (section === Sections.POSTS_PER_MONTH) {
				if (postsCountInfo < options.posts_per_month) {
					can(action, section);
					continue;
				}
			}

			if (section === Sections.TEAM_MEMBERS && options.team_members) {
				can(action, section);
				continue;
			}

			if (
				section === Sections.RBAC_MANAGE_SETTINGS &&
				["ADMIN", "SUPERADMIN"].includes(permission)
			) {
				can(action, section);
				continue;
			}

			if (
				section === Sections.RBAC_MANAGE_INTEGRATIONS &&
				["ADMIN", "SUPERADMIN"].includes(permission)
			) {
				can(action, section);
				continue;
			}

			if (
				section === Sections.RBAC_MANAGE_POSTS &&
				["USER", "ADMIN", "SUPERADMIN"].includes(permission)
			) {
				can(action, section);
				continue;
			}

			if (
				section === Sections.ADMIN &&
				["ADMIN", "SUPERADMIN"].includes(permission)
			) {
				can(action, section);
				continue;
			}

			if (
				section === Sections.COMMUNITY_FEATURES &&
				options.community_features
			) {
				can(action, section);
				continue;
			}

			if (
				section === Sections.FEATURED_BY_POSTPILOT &&
				options.featured_by_postpilot
			) {
				can(action, section);
				continue;
			}

			if (section === Sections.AI && options.ai) {
				can(action, section);
				continue;
			}

			if (
				section === Sections.IMPORT_FROM_CHANNELS &&
				options.import_from_channels
			) {
				can(action, section);
			}
		}

		return build({
			detectSubjectType: (item) =>
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				item.constructor,
		});
	}
}
