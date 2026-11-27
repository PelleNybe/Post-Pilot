import { PrismaRepository } from '@postpilot/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SetsDto } from '@postpilot/nestjs-libraries/dtos/sets/sets.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SetsRepository {
  constructor(private _sets: PrismaRepository<'sets'>) {}

  getTotal(orgId: string) {
    return this._sets.model.sets.count({
      where: {
        organizationId: orgId,
      },
    });
  }

  getSets(orgId: string) {
    return this._sets.model.sets.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  deleteSet(orgId: string, id: string) {
    return this._sets.model.sets.delete({
      where: {
        id,
        organizationId: orgId,
      },
    });
  }

  async createSet(orgId: string, body: SetsDto) {

		let newId = body.id;

		if (body.id) {
			const existing = await this._sets.model.sets.findFirst({
				where: { id: body.id, organizationId: orgId }
			});

			if (existing) {
				await this._sets.model.sets.updateMany({
					where: { id: body.id, organizationId: orgId },
					data: {
						name: body.name,
						content: body.content,
					}
				});
				return { id: body.id };
			}
		}

		newId = uuidv4();
		await this._sets.model.sets.create({
			data: {
				id: newId,
				organizationId: orgId,
				name: body.name,
				content: body.content,
			}
		});

		return { id: newId };
  }
} 