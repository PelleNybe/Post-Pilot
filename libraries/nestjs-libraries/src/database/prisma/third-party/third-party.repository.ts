import { Injectable } from "@nestjs/common";
import { AuthService } from "@postpilot/helpers/auth/auth.service";
import { PrismaRepository } from "@postpilot/nestjs-libraries/database/prisma/prisma.service";

@Injectable()
export class ThirdPartyRepository {
	constructor(private _thirdParty: PrismaRepository<"thirdParty">) {}

	getAllThirdPartiesByOrganization(org: string) {
		return this._thirdParty.model.thirdParty.findMany({
			where: { organizationId: org, deletedAt: null },
			select: {
				id: true,
				name: true,
				identifier: true,
			},
		});
	}

	deleteIntegration(org: string, id: string) {
		return this._thirdParty.model.thirdParty.updateMany({
			where: { id, organizationId: org },
			data: { deletedAt: new Date() },
		});
	}

	getIntegrationById(org: string, id: string) {
		return this._thirdParty.model.thirdParty.findFirst({
			where: { id, organizationId: org, deletedAt: null },
		});
	}

	async saveIntegration(
		org: string,
		identifier: string,
		apiKey: string,
		data: { name: string; username: string; id: string },
	) {
		const existing = await this._thirdParty.model.thirdParty.findFirst({
			where: { internalId: data.id, organizationId: org }
		});

		if (existing) {
			await this._thirdParty.model.thirdParty.update({
				where: { organizationId_internalId: { internalId: data.id, organizationId: org } },
				data: {
					name: data.name,
					identifier,
					apiKey: AuthService.fixedEncryption(apiKey),
					deletedAt: null,
				}
			});
			return this._thirdParty.model.thirdParty.findFirst({
				where: { internalId: data.id, organizationId: org }
			}) as any;
		} else {
			return this._thirdParty.model.thirdParty.create({
				data: {
					organizationId: org,
					name: data.name,
					internalId: data.id,
					identifier,
					apiKey: AuthService.fixedEncryption(apiKey),
					deletedAt: null,
				}
			});
		}
	}
}
