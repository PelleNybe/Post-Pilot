import { Injectable } from "@nestjs/common";
import { PrismaRepository } from "@postpilot/nestjs-libraries/database/prisma/prisma.service";
import type { WebhooksDto } from "@postpilot/nestjs-libraries/dtos/webhooks/webhooks.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class WebhooksRepository {
	constructor(private _webhooks: PrismaRepository<"webhooks">) {}

	getTotal(orgId: string) {
		return this._webhooks.model.webhooks.count({
			where: {
				organizationId: orgId,
				deletedAt: null,
			},
		});
	}

	getWebhooks(orgId: string) {
		return this._webhooks.model.webhooks.findMany({
			where: {
				organizationId: orgId,
				deletedAt: null,
			},
			include: {
				integrations: {
					select: {
						integration: {
							select: {
								id: true,
								picture: true,
								name: true,
							},
						},
					},
				},
			},
		});
	}

	deleteWebhook(orgId: string, id: string) {
		return this._webhooks.model.webhooks.updateMany({
			where: {
				id,
				organizationId: orgId,
			},
			data: {
				deletedAt: new Date(),
			},
		});
	}

	async createWebhook(orgId: string, body: WebhooksDto) {
		const id = body.id || uuidv4();
    if (body.id) {
      const existing = await this._webhooks.model.webhooks.findFirst({
        where: { id: body.id, organizationId: orgId },
      });
      if (existing) {
        await this._webhooks.model.webhooks.update({
          where: { id: body.id },
          data: { url: body.url, name: body.name },
        });
      } else {
        await this._webhooks.model.webhooks.create({
          data: { id, organizationId: orgId, url: body.url, name: body.name },
        });
      }
    } else {
      await this._webhooks.model.webhooks.create({
        data: { id, organizationId: orgId, url: body.url, name: body.name },
      });
    }

		await this._webhooks.model.webhooks.update({
			where: {
				id,
				organizationId: orgId,
			},
			data: {
				integrations: {
					deleteMany: {},
					create: body.integrations.map((integration) => ({
						integrationId: integration.id,
					})),
				},
			},
		});

		return { id };
	}
}
