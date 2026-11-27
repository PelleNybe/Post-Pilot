import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly _productsRepository: ProductsRepository) {}

  async create(organizationId: string, data: Prisma.ProductCreateInput) {
    return this._productsRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    return this._productsRepository.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    const product = await this._productsRepository.findOne(organizationId, id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    organizationId: string,
    id: string,
    data: Prisma.ProductUpdateInput
  ) {
    await this.findOne(organizationId, id); // Ensure it exists and belongs to org
    return this._productsRepository.update(organizationId, id, data);
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id); // Ensure it exists and belongs to org
    return this._productsRepository.remove(organizationId, id);
  }
}
