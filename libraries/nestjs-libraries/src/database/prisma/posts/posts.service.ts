import {
	BadRequestException,
	Injectable,
	Logger,
	ValidationPipe,
} from "@nestjs/common";
import {

	minifyPosts,
	minifyPostsList,
} from "@postpilot/helpers/utils/posts.list.minify";
import { IntegrationService } from "@postpilot/nestjs-libraries/database/prisma/integrations/integration.service";
import { MediaService } from "@postpilot/nestjs-libraries/database/prisma/media/media.service";
import { PostsRepository } from "@postpilot/nestjs-libraries/database/prisma/posts/posts.repository";
import {
	type CreateGeneratedPostsDto,

} from "@postpilot/nestjs-libraries/dtos/generator/create.generated.posts.dto";
import {
	CreatePostDto,

} from "@postpilot/nestjs-libraries/dtos/posts/create.post.dto";
import {
	type CreateTagDto,

} from "@postpilot/nestjs-libraries/dtos/posts/create.tag.dto";
import {
	type GetPostsDto,

} from "@postpilot/nestjs-libraries/dtos/posts/get.posts.dto";
import {
	type GetPostsListDto,

} from "@postpilot/nestjs-libraries/dtos/posts/get.posts.list.dto";
import { IntegrationManager } from "@postpilot/nestjs-libraries/integrations/integration.manager";
import { OpenaiService } from "@postpilot/nestjs-libraries/openai/openai.service";
import { makeId } from "@postpilot/nestjs-libraries/services/make.is";
import { ShortLinkService } from "@postpilot/nestjs-libraries/short-linking/short.link.service";
import {

	UploadFactory,
} from "@postpilot/nestjs-libraries/upload/upload.factory";
import {
	From,
	type Integration,

	Media,
	type Post,
	type State,
} from "@prisma/client";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {  shuffle } from "lodash";
import sharp from "sharp";
import {  Readable } from "stream";
import { validate as isUUID,  v4 as uuidv4 } from "uuid";

dayjs.extend(utc);

import {  timer } from "@postpilot/helpers/utils/timer";
import { RefreshIntegrationService } from "@postpilot/nestjs-libraries/integrations/refresh.integration.service";
import {
	type AnalyticsData,

} from "@postpilot/nestjs-libraries/integrations/social/social.integrations.interface";
import {

	RefreshToken,
} from "@postpilot/nestjs-libraries/integrations/social.abstract";
import {
	ioRedis,

} from "@postpilot/nestjs-libraries/redis/redis.service";
import {

	organizationId,
	postId as postIdSearchParam,
} from "@postpilot/nestjs-libraries/temporal/temporal.search.attribute";
import * as Sentry from "@sentry/nestjs";
import { TypedSearchAttributes } from "@temporalio/common";
import { TemporalService } from "nestjs-temporal-core";

type PostWithConditionals = Post & {
	integration?: Integration;
	childrenPost: Post[];
};

@Injectable()
export class PostsService {
	private storage = UploadFactory.createStorage();
	constructor(
		private _postRepository: PostsRepository,
		private _integrationManager: IntegrationManager,
		private _integrationService: IntegrationService,
		private _mediaService: MediaService,
		private _shortLinkService: ShortLinkService,
		private _openaiService: OpenaiService,
		private _temporalService: TemporalService,
		private _refreshIntegrationService: RefreshIntegrationService,
	) {}

	searchForMissingThreeHoursPosts() {
		return this._postRepository.searchForMissingThreeHoursPosts();
	}

	updatePost(id: string, postId: string, releaseURL: string) {
		return this._postRepository.updatePost(id, postId, releaseURL);
	}

	async getMissingContent(
		orgId: string,
		postId: string,
		forceRefresh = false,
	): Promise<{ id: string; url: string }[]> {
		const post = await this._postRepository.getPostById(postId, orgId);
		if (!post || post.releaseId !== "missing") {
			return [];
		}

		const integrationProvider = this._integrationManager.getSocialIntegration(
			post.integration.providerIdentifier,
		);

		if (!integrationProvider.missing) {
			return [];
		}

		const getIntegration = post.integration!;

		if (
			dayjs(getIntegration?.tokenExpiration).isBefore(dayjs()) ||
			forceRefresh
		) {
			const data =
				await this._refreshIntegrationService.refresh(getIntegration);
			if (!data) {
				return [];
			}

			const { accessToken } = data;

			if (accessToken) {
				getIntegration.token = accessToken;

				if (integrationProvider.refreshWait) {
					await timer(10000);
				}
			} else {
				await this._integrationService.disconnectChannel(orgId, getIntegration);
				return [];
			}
		}

		try {
			return await integrationProvider.missing(
				getIntegration.internalId,
				getIntegration.token,
			);
		} catch (e) {
			Logger.error(e);
			if (e instanceof RefreshToken) {
				return this.getMissingContent(orgId, postId, true);
			}
		}

		return [];
	}

	async updateReleaseId(orgId: string, postId: string, releaseId: string) {
		return this._postRepository.updateReleaseId(postId, orgId, releaseId);
	}

	async checkPostAnalytics(
		orgId: string,
		postId: string,
		date: number,
		forceRefresh = false,
	): Promise<AnalyticsData[] | { missing: true }> {
		const post = await this._postRepository.getPostById(postId, orgId);
		if (!post || !post.releaseId) {
			return [];
		}

		if (post.releaseId === "missing") {
			return { missing: true };
		}

		const integrationProvider = this._integrationManager.getSocialIntegration(
			post.integration.providerIdentifier,
		);

		if (!integrationProvider.postAnalytics) {
			return [];
		}

		const getIntegration = post.integration!;

		if (
			dayjs(getIntegration?.tokenExpiration).isBefore(dayjs()) ||
			forceRefresh
		) {
			const data =
				await this._refreshIntegrationService.refresh(getIntegration);
			if (!data) {
				return [];
			}

			const { accessToken } = data;

			if (accessToken) {
				getIntegration.token = accessToken;

				if (integrationProvider.refreshWait) {
					await timer(10000);
				}
			} else {
				await this._integrationService.disconnectChannel(orgId, getIntegration);
				return [];
			}
		}

		try {
			const loadAnalytics = await integrationProvider.postAnalytics(
				getIntegration.internalId,
				getIntegration.token,
				post.releaseId,
				date,
			);
			await ioRedis.set(
				`integration:${orgId}:${post.id}:${date}`,
				JSON.stringify(loadAnalytics),
				"EX",
				!process.env.NODE_ENV || process.env.NODE_ENV === "development"
					? 1
					: 3600,
			);
			return loadAnalytics;
		} catch (e) {
			Logger.error(e);
			if (e instanceof RefreshToken) {
				return this.checkPostAnalytics(orgId, postId, date, true);
			}
		}

		return [];
	}

	async getStatistics(orgId: string, id: string) {
		const getPost = await this.getPostsRecursively(id, true, orgId, true);
		const content = getPost.map((p) => p.content);
		const shortLinksTracking =
			await this._shortLinkService.getStatistics(content);

		return {
			clicks: shortLinksTracking,
		};
	}

	async mapTypeToPost(
		body: CreatePostDto,
		organization: string,
		replaceDraft: boolean = false,
	): Promise<CreatePostDto> {
		if (!body?.posts?.every((p) => p?.integration?.id)) {
			throw new BadRequestException("All posts must have an integration id");
		}

		const uniqueIntegrationIds = [
			...new Set(body.posts.map((p) => p.integration.id)),
		];
		const integrations = await this._integrationService.getIntegrationsByIds(
			organization,
			uniqueIntegrationIds,
		);
		const integrationsMap = new Map(integrations.map((i) => [i.id, i]));

		const mappedValues = {
			...body,
			type: replaceDraft ? "schedule" : body.type,
			posts: await Promise.all(
				body.posts.map(async (post) => {
					const integration = integrationsMap.get(post.integration.id);

					if (!integration) {
						throw new BadRequestException(
							`Integration with id ${post.integration.id} not found`,
						);
					}

					return {
						type: replaceDraft ? "schedule" : body.type,
						...post,
						settings: {
							...(post.settings || ({} as any)),
							__type: integration.providerIdentifier,
						},
					};
				}),
			),
		};

		const validationPipe = new ValidationPipe({
			skipMissingProperties: false,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		});

		return await validationPipe.transform(mappedValues, {
			type: "body",
			metatype: CreatePostDto,
		});
	}

	async getPostsRecursively(
		id: string,
		includeIntegration = false,
		orgId?: string,
		isFirst?: boolean,
	): Promise<PostWithConditionals[]> {
		const post = await this._postRepository.getPost(
			id,
			includeIntegration,
			orgId,
			isFirst,
		);

		if (!post) {
			return [];
		}

		return [
			post!,
			...(post?.childrenPost?.length
				? await this.getPostsRecursively(
						post?.childrenPost?.[0]?.id,
						false,
						orgId,
						false,
					)
				: []),
		];
	}

	async getPosts(orgId: string, query: GetPostsDto) {
		return this._postRepository.getPosts(orgId, query);
	}

	async getPostsMinified(orgId: string, query: GetPostsDto) {
		return minifyPosts({
			posts: await this._postRepository.getPosts(orgId, query),
		});
	}

	async getPostsList(orgId: string, query: GetPostsListDto) {
		return minifyPostsList(
			await this._postRepository.getPostsList(orgId, query),
		);
	}

	async updateMedia(id: string, imagesList: any[], convertToJPEG = false) {
		try {
			let imageUpdateNeeded = false;
			const getImageList = await Promise.all(
				(
					await Promise.all(
						(imagesList || []).map(async (p: any) => {
							if (!p.path && p.id) {
								imageUpdateNeeded = true;
								return this._mediaService.getMediaById(p.id);
							}

							return p;
						}),
					)
				)
					.map((m) => {
						return {
							...m,
							url:
								m.path.indexOf("http") === -1
									? process.env.FRONTEND_URL +
										"/" +
										process.env.NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY +
										m.path
									: m.path,
							type: "image",
							path:
								m.path.indexOf("http") === -1
									? process.env.UPLOAD_DIRECTORY + m.path
									: m.path,
						};
					})
					.map(async (m) => {
						if (!convertToJPEG) {
							return m;
						}

						if (m.path.indexOf(".png") > -1) {
							imageUpdateNeeded = true;
							const response = await axios.get(m.url, {
								responseType: "arraybuffer",
							});

							const imageBuffer = Buffer.from(response.data);

							// Use sharp to get the metadata of the image
							const buffer = await sharp(imageBuffer)
								.jpeg({ quality: 100 })
								.toBuffer();

							const { path, originalname } = await this.storage.uploadFile({
								buffer,
								mimetype: "image/jpeg",
								size: buffer.length,
								path: "",
								fieldname: "",
								destination: "",
								stream: new Readable(),
								filename: "",
								originalname: "",
								encoding: "",
							});

							return {
								...m,
								name: originalname,
								url:
									path.indexOf("http") === -1
										? process.env.FRONTEND_URL +
											"/" +
											process.env.NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY +
											path
										: path,
								type: "image",
								path:
									path.indexOf("http") === -1
										? process.env.UPLOAD_DIRECTORY + path
										: path,
							};
						}

						return m;
					}),
			);

			if (imageUpdateNeeded) {
				await this._postRepository.updateImages(
					id,
					JSON.stringify(getImageList),
				);
			}

			return getImageList;
		} catch (err: any) {
			return imagesList;
		}
	}

	async getPostsByGroup(orgId: string, group: string) {
		const convertToJPEG = false;
		const loadAll = await this._postRepository.getPostsByGroup(orgId, group);
		const posts = this.arrangePostsByGroup(loadAll, undefined);

		return {
			group: posts?.[0]?.group,
			posts: await Promise.all(
				(posts || []).map(async (post) => ({
					...post,
					image: await this.updateMedia(
						post.id,
						JSON.parse(post.image || "[]"),
						convertToJPEG,
					),
				})),
			),
			integrationPicture: posts[0]?.integration?.picture,
			integration: posts[0].integrationId,
			settings: JSON.parse(posts[0].settings || "{}"),
		};
	}

	arrangePostsByGroup(all: any, parent?: string): PostWithConditionals[] {
		const findAll = all
			.filter((p: any) =>
				!parent ? !p.parentPostId : p.parentPostId === parent,
			)
			.map(({ integration, ...all }: any) => ({
				...all,
				...(!parent ? { integration } : {}),
			}));

		return [
			...findAll,
			...(findAll.length
				? findAll.flatMap((p: any) => this.arrangePostsByGroup(all, p.id))
				: []),
		];
	}

	async getPost(orgId: string, id: string, convertToJPEG = false) {
		const posts = await this.getPostsRecursively(id, true, orgId, true);
		const list = {
			group: posts?.[0]?.group,
			posts: await Promise.all(
				(posts || []).map(async (post) => ({
					...post,
					image: await this.updateMedia(
						post.id,
						JSON.parse(post.image || "[]"),
						convertToJPEG,
					),
				})),
			),
			integrationPicture: posts[0]?.integration?.picture,
			integration: posts[0].integrationId,
			settings: JSON.parse(posts[0].settings || "{}"),
		};

		return list;
	}

	async getOldPosts(orgId: string, date: string) {
		return this._postRepository.getOldPosts(orgId, date);
	}

	public async updateTags(orgId: string, post: Post[]): Promise<Post[]> {
		const plainText = JSON.stringify(post);
		const extract = Array.from(
			plainText.match(/\(post:[a-zA-Z0-9-_]+\)/g) || [],
		);
		if (!extract.length) {
			return post;
		}

		const ids = (extract || []).map((e) =>
			e.replace("(post:", "").replace(")", ""),
		);
		const urls = await this._postRepository.getPostUrls(orgId, ids);
		const newPlainText = ids.reduce((acc, value) => {
			const findUrl = urls?.find?.((u) => u.id === value)?.releaseURL || "";
			return acc.replace(
				new RegExp(`\\(post:${value}\\)`, "g"),
				findUrl.split(",")[0],
			);
		}, plainText);

		return this.updateTags(orgId, JSON.parse(newPlainText) as Post[]);
	}

	public async checkInternalPlug(
		integration: Integration,
		orgId: string,
		id: string,
		settings: any,
	) {
		const plugs = Object.entries(settings).filter(([key]) => {
			return key.indexOf("plug-") > -1;
		});

		if (plugs.length === 0) {
			return [];
		}

		const parsePlugs = plugs.reduce((all, [key, value]) => {
			const [_, name, identifier] = key.split("--");
			all[name] = all[name] || { name };
			all[name][identifier] = value;
			return all;
		}, {} as any);

		const list: {
			name: string;
			integrations: { id: string }[];
			delay: string;
			active: boolean;
		}[] = Object.values(parsePlugs);

		return (list || []).flatMap((trigger) => {
			return (trigger?.integrations || []).flatMap((int) => ({
				type: "internal-plug",
				post: id,
				originalIntegration: integration.id,
				integration: int.id,
				plugName: trigger.name,
				orgId: orgId,
				delay: +trigger.delay,
				information: trigger,
			}));
		});
	}

	public async checkPlugs(
		orgId: string,
		providerName: string,
		integrationId: string,
	) {
		const loadAllPlugs = this._integrationManager.getAllPlugs();
		const getPlugs = await this._integrationService.getPlugs(
			orgId,
			integrationId,
		);

		const currentPlug = loadAllPlugs.find((p) => p.identifier === providerName);

		return getPlugs
			.filter((plug) => {
				return currentPlug?.plugs?.some(
					(p: any) => p.methodName === plug.plugFunction,
				);
			})
			.map((plug) => {
				const runPlug = currentPlug?.plugs?.find(
					(p: any) => p.methodName === plug.plugFunction,
				)!;
				return {
					type: "global",
					plugId: plug.id,
					delay: runPlug.runEveryMilliseconds,
					totalRuns: runPlug.totalRuns,
				};
			});
	}

	async deletePost(orgId: string, group: string) {
		const post = await this._postRepository.deletePost(orgId, group);

		if (post?.id) {
			await this.terminatePostWorkflows(post.id);
		}

		return { error: true };
	}

	async deletePostsByGroups(orgId: string, groups: string[]) {
		const posts = await this._postRepository.deletePostsByGroups(orgId, groups);

		if (posts.length) {
			await Promise.all(
				posts.map((post) => this.terminatePostWorkflows(post.id)),
			);
		}

		return { error: true };
	}

	private async terminatePostWorkflows(postId: string) {
		if (!isUUID(postId)) {
			throw new BadRequestException("Invalid postId format");
		}

		try {
			const workflows = this._temporalService.client
				.getRawClient()
				?.workflow.list({
					query: `postId="${postId.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}" AND ExecutionStatus="Running"`,
				});

			// Fetch all execution infos first from the async iterator
			const executionInfos = [];
			for await (const executionInfo of workflows) {
				executionInfos.push(executionInfo);
			}

			// ⚡ PelleNybe from Corax CoLAB: Use Promise.all and map to parallelize Temporal workflow terminations
			await Promise.all(
				executionInfos.map(async (executionInfo) => {
					try {
						const workflow =
							await this._temporalService.client.getWorkflowHandle(
								executionInfo.workflowId,
							);
						if (
							workflow &&
							(await workflow.describe()).status.name !== "TERMINATED"
						) {
							await workflow.terminate();
						}
					} catch (err) {}
				}),
			);
		} catch (err) {}
	}

	async countPostsFromDay(orgId: string, date: Date) {
		return this._postRepository.countPostsFromDay(orgId, date);
	}

	getPostByForWebhookId(id: string) {
		return this._postRepository.getPostByForWebhookId(id);
	}

	async startWorkflow(
		taskQueue: string,
		postId: string,
		orgId: string,
		state: State,
	) {
		await this.terminatePostWorkflows(postId);

		if (state === "DRAFT") {
			return;
		}

		try {
			await this._temporalService.client
				.getRawClient()
				?.workflow.start("postWorkflowV101", {
					workflowId: `post_${postId}`,
					taskQueue: "main",
					workflowIdConflictPolicy: "TERMINATE_EXISTING",
					args: [
						{
							taskQueue: taskQueue,
							postId: postId,
							organizationId: orgId,
						},
					],
					typedSearchAttributes: new TypedSearchAttributes([
						{
							key: postIdSearchParam,
							value: postId,
						},
						{
							key: organizationId,
							value: orgId,
						},
					]),
				});
		} catch (err) {}
	}

	async createPost(orgId: string, body: CreatePostDto): Promise<any[]> {
		// ⚡ Bolt: Replaced sequential for...of loop with Promise.all to parallelize post creation across multiple integrations
		const postList = await Promise.all(
			body.posts.map(async (post) => {
				const messages = (post.value || []).map((p) => p.content);
				const updateContent = !body.shortLink
					? messages
					: await this._shortLinkService.convertTextToShortLinks(
							orgId,
							messages,
						);

				post.value = (post.value || []).map((p, i) => ({
					...p,
					content: updateContent[i],
				}));

				const { posts } = await this._postRepository.createOrUpdatePost(
					body.type,
					orgId,
					body.type === "now"
						? dayjs().format("YYYY-MM-DDTHH:mm:00")
						: body.date,
					post,
					body.tags,
					body.inter,
				);

				if (!posts?.length) {
					return null;
				}

				if (body.type !== "update") {
					this.startWorkflow(
						post.settings.__type.split("-")[0].toLowerCase(),
						posts[0].id,
						orgId,
						posts[0].state,
					).catch((err) => {});
				}

				Sentry.metrics.count("post_created", 1);
				return {
					postId: posts[0].id,
					integration: post.integration.id,
				};
			}),
		);

		if (postList.includes(null)) {
			return [] as any[];
		}

		return postList as any[];
	}

	async separatePosts(content: string, len: number) {
		return this._openaiService.separatePosts(content, len);
	}

	async generateTags(content: string) {
		const prompt = `Extract the 3 to 5 most relevant and viral hashtags for the following social media post. Return ONLY the hashtags separated by a space. Post: "${content}"`;
		const posts = await this._openaiService.generatePosts(prompt);
		if (posts && posts.length > 0) {
			return {
				tags: posts[0]?.post?.split(" ")?.filter((t: string) => t.startsWith("#")) || [
					"#viral",
					"#trending",
				],
			};
		}
		return { tags: ["#postpilot", "#trending", "#socialmedia"] };
	}

	async translatePost(content: string, targetLanguage: string) {
		const prompt = `Translate the following social media post to ${targetLanguage}. Keep emojis and formatting intact. Return ONLY the translation in JSON format like {"post": "translation"}. Post: "${content}"`;
		const posts = await this._openaiService.generatePosts(prompt);
		if (posts && posts.length > 0) {
			return { translated: posts[0]?.post || content };
		}
		return { translated: content };
	}

	async generateHooks(content: string) {
		const hooks = await this._openaiService.generateHooks(content);
		return { hooks };
	}

	async rewriteTone(content: string, tone: string) {
		const rewritten = await this._openaiService.rewriteTone(content, tone);
		return { rewritten };
	}

	async getOrganizationOverview(organizationId: string) {
		const [overview, integrations] = await Promise.all([
			this._postRepository.getOrganizationOverview(organizationId),
			this._integrationService.getIntegrationsList(organizationId),
		]);
		const activeChannels = (integrations || []).filter((i: any) => !i.disabled).length;
		return {
			...overview,
			activeChannels,
			totalChannels: (integrations || []).length,
		};
	}

	async changeState(id: string, state: State, err?: any, body?: any) {
		return this._postRepository.changeState(id, state, err, body);
	}

	async userChangeStateBulk(organizationId: string, ids: string[], state: State) {
		const res = await this._postRepository.updateStateBulk(
			organizationId,
			ids,
			state,
		);

		if (state === "QUEUE") {
			const posts = await this._postRepository.getPostUrls(organizationId, ids);
			if (posts) {
				await Promise.all(
					posts.map(async (post) => {
						if ((post as any).integration && (post as any).integration.providerIdentifier) {
							try {
								await this.startWorkflow(
									(post as any).integration.providerIdentifier.split("-")[0].toLowerCase(),
									post.id,
									organizationId,
									"QUEUE",
								);
							} catch (err) {}
						}
					})
				);
			}
		}
		return res;
	}

	async userChangeState(organizationId: string, id: string, state: State) {
		const res = await this._postRepository.updateState(
			organizationId,
			id,
			state,
		);
		if (state === "QUEUE") {
			const post = await this._postRepository.getPostById(id, organizationId);
			if (post && post.integration && post.integration.providerIdentifier) {
				try {
					await this.startWorkflow(
						(post as any).integration.providerIdentifier.split("-")[0].toLowerCase(),
						post.id,
						organizationId,
						"QUEUE",
					);
				} catch (err) {}
			}
		}
		return res;
	}

	async changeDate(
		orgId: string,
		id: string,
		date: string,
		action: "schedule" | "update" = "schedule",
	) {
		const getPostById = await this._postRepository.getPostById(id, orgId);

		// schedule: Set status to QUEUE and change date (reschedule the post)
		// update: Just change the date without changing the status
		const newDate = await this._postRepository.changeDate(
			orgId,
			id,
			date,
			getPostById.state === "DRAFT",
			action,
		);

		if (action === "schedule") {
			try {
				await this.startWorkflow(
					getPostById.integration.providerIdentifier
						.split("-")[0]
						.toLowerCase(),
					getPostById.id,
					orgId,
					getPostById.state === "DRAFT" ? "DRAFT" : "QUEUE",
				);
			} catch (err) {}
		}

		return newDate;
	}

	async generatePostsDraft(orgId: string, body: CreateGeneratedPostsDto) {
		const getAllIntegrations = (
			await this._integrationService.getIntegrationsList(orgId)
		).filter((f) => !f.disabled && f.providerIdentifier !== "reddit");

		// const posts = chunk(body.posts, getAllIntegrations.length);
		const allDates = dayjs()
			.isoWeek(body.week)
			.year(body.year)
			.startOf("isoWeek");

		const dates = [...new Array(7)].map((_, i) => {
			return allDates.add(i, "day").format("YYYY-MM-DD");
		});

		const findTime = (): string => {
			const randomValues = new Uint32Array(1);
			globalThis.crypto.getRandomValues(randomValues);
			const totalMinutes =
				Math.floor((randomValues[0] / (0xffffffff + 1)) * 144) * 10;

			// Convert total minutes to hours and minutes
			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;

			// Format hours and minutes to always be two digits
			const formattedHours = hours.toString().padStart(2, "0");
			const formattedMinutes = minutes.toString().padStart(2, "0");
			const randomDate =
				shuffle(dates)[0] + "T" + `${formattedHours}:${formattedMinutes}:00`;

			if (dayjs(randomDate).isBefore(dayjs())) {
				return findTime();
			}

			return randomDate;
		};

		const batchData: any[] = getAllIntegrations.flatMap((integration) =>
			body.posts.flatMap((toPost) => {
				const group = makeId(10);
				const randomDate = findTime();
				const publishDate = dayjs(randomDate).toDate();
				const settings = JSON.stringify({
					__type: integration.providerIdentifier as any,
					title: "",
					tags: [],
					subreddit: [],
				});

				const postContents = [
					...toPost.list.map((l) => ({
						content: l.post,
					})),
					{
						content: `Check out the full story here:\n${
							body.postId || body.url
						}`,
					},
				];

				let parentPostId: string | null = null;
				return postContents.map((content) => {
					const postId = uuidv4();
					const postData = {
						id: postId,
						publishDate,
						integrationId: integration.id,
						content: content.content,
						delay: 0,
						group,
						parentPostId,
						settings,
						image: "[]",
					};
					parentPostId = postId;
					return postData;
				});
			}),
		);

		if (batchData.length > 0) {
			await this._postRepository.createDraftsBatch(orgId, batchData);
			Sentry.metrics.count("post_created", batchData.length);
		}
	}

	findAllExistingCategories() {
		return this._postRepository.findAllExistingCategories();
	}

	findAllExistingTopicsOfCategory(category: string) {
		return this._postRepository.findAllExistingTopicsOfCategory(category);
	}

	findPopularPosts(category: string, topic?: string) {
		return this._postRepository.findPopularPosts(category, topic);
	}

	async findFreeDateTime(orgId: string, integrationId?: string) {
		const findTimes = await this._integrationService.findFreeDateTime(
			orgId,
			integrationId,
		);
		return this.findFreeDateTimeRecursive(
			orgId,
			findTimes,
			dayjs.utc().startOf("day"),
		);
	}

	async createPopularPosts(post: {
		category: string;
		topic: string;
		content: string;
		hook: string;
	}) {
		return this._postRepository.createPopularPosts(post);
	}

	private async findFreeDateTimeRecursive(
		orgId: string,
		times: number[],
		date: dayjs.Dayjs,
	): Promise<string> {
		const list = await this._postRepository.getPostsCountsByDates(
			orgId,
			times,
			date,
		);

		if (!list.length) {
			return this.findFreeDateTimeRecursive(orgId, times, date.add(1, "day"));
		}

		const num = list.reduce<null | number>((prev, curr) => {
			if (prev === null || prev > curr) {
				return curr;
			}
			return prev;
		}, null) as number;

		return date.clone().add(num, "minutes").format("YYYY-MM-DDTHH:mm:00");
	}

	getComments(postId: string) {
		return this._postRepository.getComments(postId);
	}

	getTags(orgId: string) {
		return this._postRepository.getTags(orgId);
	}

	createTag(orgId: string, body: CreateTagDto) {
		return this._postRepository.createTag(orgId, body);
	}

	editTag(id: string, orgId: string, body: CreateTagDto) {
		return this._postRepository.editTag(id, orgId, body);
	}

	deleteTag(id: string, orgId: string) {
		return this._postRepository.deleteTag(id, orgId);
	}

	createComment(
		orgId: string,
		userId: string,
		postId: string,
		comment: string,
	) {
		return this._postRepository.createComment(orgId, userId, postId, comment);
	}
}
