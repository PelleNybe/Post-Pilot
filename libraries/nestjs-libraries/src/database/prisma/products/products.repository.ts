import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaRepository } from '../prisma.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly _product: PrismaRepository<'product'>) {}

  create(organizationId: string, data: Prisma.ProductCreateInput) {
    return this._product.model.product.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  findAll(organizationId: string) {
    return this._product.model.product.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(organizationId: string, id: string) {
    return this._product.model.product.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  update(
    organizationId: string,
    id: string,
    data: Prisma.ProductUpdateInput
  ) {
    return this._product.model.product.updateMany({
      where: { id, organizationId },
      data,
    });
  }

  remove(organizationId: string, id: string) {
    return this._product.model.product.updateMany({
      where: { id, organizationId },
      data: { deletedAt: new Date(), active: false },
    });
  }
}
