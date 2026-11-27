import { Injectable } from "@nestjs/common";
import { PrismaRepository } from "@postpilot/nestjs-libraries/database/prisma/prisma.service";
import type { SaveMediaInformationDto } from "@postpilot/nestjs-libraries/dtos/media/save.media.information.dto";

@Injectable()
export class MediaRepository {
	constructor(private _media: PrismaRepository<"media">) {}

	saveFile(
		org: string,
		fileName: string,
		filePath: string,
		originalName?: string,
	) {
		return this._media.model.media.create({
			data: {
				organization: {
					connect: {
						id: org,
					},
				},
				name: fileName,
				path: filePath,
				originalName: originalName || null,
			},
			select: {
				id: true,
				name: true,
				originalName: true,
				path: true,
				thumbnail: true,
				alt: true,
			},
		});
	}

	getMediaById(id: string) {
		return this._media.model.media.findUnique({
			where: {
				id,
			},
		});
	}

	deleteMedia(org: string, id: string) {
		return this._media.model.media.updateMany({
			where: {
				id,
				organizationId: org,
			},
			data: {
				deletedAt: new Date(),
			},
		});
	}

	saveMediaInformation(org: string, data: SaveMediaInformationDto) {
		return this._media.model.media
			.updateMany({
				where: {
					id: data.id,
					organizationId: org,
				},
				data: {
					alt: data.alt,
					thumbnail: data.thumbnail,
					thumbnailTimestamp: data.thumbnailTimestamp,
				},
			})
			.then(async () => {
				return this._media.model.media.findFirst({
					where: { id: data.id, organizationId: org },
					select: {
						id: true,
						name: true,
						originalName: true,
						alt: true,
						thumbnail: true,
						path: true,
						thumbnailTimestamp: true,
					},
				});
			});
	}

	async getMedia(org: string, page: number) {
		const pageNum = (page || 1) - 1;
		const query = {
			where: {
				organization: {
					id: org,
				},
			},
		};
		const pages = Math.ceil((await this._media.model.media.count(query)) / 18);
		const results = await this._media.model.media.findMany({
			where: {
				organizationId: org,
				deletedAt: null,
			},
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				name: true,
				originalName: true,
				path: true,
				thumbnail: true,
				alt: true,
				thumbnailTimestamp: true,
			},
			skip: pageNum * 18,
			take: 18,
		});

		return {
			pages,
			results,
		};
	}
}
