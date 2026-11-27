import { Injectable } from "@nestjs/common";
import { PrismaRepository } from "@postpilot/nestjs-libraries/database/prisma/prisma.service";
import type { AutopostDto } from "@postpilot/nestjs-libraries/dtos/autopost/autopost.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AutopostRepository {
	constructor(private _autoPost: PrismaRepository<"autoPost">) {}

	getTotal(orgId: string) {
		return this._autoPost.model.autoPost.count({
			where: {
				organizationId: orgId,
				deletedAt: null,
			},
		});
	}

	changeActiveMany(orgId: string, ids: string[], active: boolean) {
		return this._autoPost.model.autoPost.updateMany({
			where: {
				id: {
					in: ids,
				},
				organizationId: orgId,
			},
			data: {
				active,
			},
		});
	}

	getAutoposts(orgId: string) {
		return this._autoPost.model.autoPost.findMany({
			where: {
				organizationId: orgId,
				deletedAt: null,
			},
		});
	}

	deleteAutopost(orgId: string, id: string) {
		return this._autoPost.model.autoPost.updateMany({
			where: {
				id,
				organizationId: orgId,
			},
			data: {
				deletedAt: new Date(),
			},
		});
	}

	getAutopost(id: string) {
		return this._autoPost.model.autoPost.findFirst({
			where: {
				id,
				deletedAt: null,
			},
		});
	}

	updateUrl(id: string, url: string) {
		return this._autoPost.model.autoPost.update({
			where: {
				id,
			},
			data: {
				lastUrl: url,
			},
		});
	}

	changeActive(orgId: string, id: string, active: boolean) {
		return this._autoPost.model.autoPost.updateMany({
			where: {
				id,
				organizationId: orgId,
			},
			data: {
				active,
			},
		});
	}

	async createAutopost(orgId: string, body: AutopostDto, id?: string) {

		let newId = id;
		const activeValue = body.active;

		if (id) {
			const existing = await this._autoPost.model.autoPost.findFirst({
				where: { id, organizationId: orgId }
			});

			if (existing) {
				await this._autoPost.model.autoPost.updateMany({
					where: { id, organizationId: orgId },
					data: {
						url: body.url,
						title: body.title,
						integrations: JSON.stringify(body.integrations),
						active: body.active,
						content: body.content,
						generateContent: body.generateContent,
						addPicture: body.addPicture,
						syncLast: body.syncLast,
						onSlot: body.onSlot,
						lastUrl: body.lastUrl,
					}
				});
				return { id, active: activeValue };
			}
		}

		newId = uuidv4();
		await this._autoPost.model.autoPost.create({
			data: {
				id: newId,
				organizationId: orgId,
				url: body.url,
				title: body.title,
				integrations: JSON.stringify(body.integrations),
				active: body.active,
				content: body.content,
				generateContent: body.generateContent,
				addPicture: body.addPicture,
				syncLast: body.syncLast,
				onSlot: body.onSlot,
				lastUrl: body.lastUrl,
			}
		});

		return { id: newId, active: activeValue };
	}
}
