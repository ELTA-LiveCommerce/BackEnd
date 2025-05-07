import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateProductAttributeDto, UpdateProductAttributeDto } from '@/module/product/dto/product-attribute.dto';
import { ProductAttribute } from '@/module/product/entity/product-attribute.entity';
import { ProductAttributeService } from '@/module/product/product-attribute.service';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('products/:productId/attributes')
export class ProductAttributeController {
  constructor(private readonly attributeService: ProductAttributeService) {}

  /**
   * 특정 상품의 모든 속성을 조회합니다.
   */
  @Get()
  findByProductId(@Param('productId') productId: string): Promise<ProductAttribute[]> {
    return this.attributeService.findByProductId(productId);
  }

  /**
   * 특정 속성을 ID로 조회합니다.
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductAttribute> {
    return this.attributeService.findOne(id);
  }

  /**
   * 상품에 새 속성을 추가합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  create(
    @Param('productId') productId: string,
    @Body() createAttributeDto: CreateProductAttributeDto,
  ): Promise<ProductAttribute> {
    return this.attributeService.create(createAttributeDto, productId);
  }

  /**
   * 여러 속성을 일괄 추가합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  createBulk(
    @Param('productId') productId: string,
    @Body() attributeDtos: CreateProductAttributeDto[],
  ): Promise<ProductAttribute[]> {
    return this.attributeService.createBulk(productId, attributeDtos);
  }

  /**
   * 속성을 업데이트합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateAttributeDto: UpdateProductAttributeDto): Promise<ProductAttribute> {
    return this.attributeService.update(id, updateAttributeDto);
  }

  /**
   * 속성을 삭제합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.attributeService.remove(id);
  }
}
