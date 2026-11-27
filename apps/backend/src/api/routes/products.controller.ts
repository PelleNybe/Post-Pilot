import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProductsService } from '@postpilot/nestjs-libraries/database/prisma/products/products.service';
import { GetOrgFromRequest } from '@postpilot/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { CreateProductDto } from '@postpilot/nestjs-libraries/dtos/products/create.product.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @GetOrgFromRequest() org: Organization,
    @Body() data: CreateProductDto
  ) {
    return this.productsService.create(org.id, data as any);
  }

  @Get()
  async findAll(@GetOrgFromRequest() org: Organization) {
    return this.productsService.findAll(org.id);
  }

  @Get(':id')
  async findOne(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.productsService.findOne(org.id, id);
  }

  @Put(':id')
  async update(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() data: Partial<CreateProductDto>
  ) {
    return this.productsService.update(org.id, id, data);
  }

  @Delete(':id')
  async remove(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.productsService.remove(org.id, id);
  }
}
