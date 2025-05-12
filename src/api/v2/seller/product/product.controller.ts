import { Body, Controller, Post, Put, Param, UseGuards, ParseUUIDPipe, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import { ProductService } from '@/module/product/product.service';
import {
  SellerProductCreateRequestDto,
  SellerProductUpdateRequestDto,
  SellerProductListRequestDto,
} from './product.request.dto';
import {
  SellerProductResponseDto,
  SellerProductResponseBodyDto,
  SellerProductListResponseDto,
  SellerProductListItemDto,
} from './product.response.dto';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

@ApiTags('v2/seller/products')
@ApiBearerAuth()
@Controller('v2/seller/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: '판매자 상품 목록 조회' })
  @ApiOkResponse({ description: '상품 목록 조회 성공', type: SellerProductListResponseDto })
  async getSellerProducts(
    @Query() query: SellerProductListRequestDto,
    @GetUser() seller: User,
  ): Promise<SellerProductListResponseDto> {
    const serviceResponse = await this.productService.findSellerProductsPaged(seller.id, query);
    const { items, total, page, limit } = serviceResponse.data;
    return PagedResponseV2.create(items, total, page, limit, '상품 목록 조회 성공');
  }

  @Post()
  @ApiOperation({ summary: '판매자 상품 등록' })
  @ApiCreatedResponse({ type: SellerProductResponseDto })
  async createProduct(
    @Body() createDto: SellerProductCreateRequestDto,
    @GetUser() seller: User,
  ): Promise<SellerProductResponseDto> {
    // TODO: ProductService.createProduct 구현 및 호출
    const product = await this.productService.createSellerProduct(seller.id, createDto);
    const responseBody = SellerProductResponseBodyDto.fromEntity(product);
    return BaseResponseV2.success(responseBody, '상품이 성공적으로 등록되었습니다.', HttpStatus.CREATED);
  }

  @Put(':productId')
  @ApiOperation({ summary: '판매자 상품 수정' })
  @ApiOkResponse({ type: SellerProductResponseDto })
  async updateProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() updateDto: SellerProductUpdateRequestDto,
    @GetUser() seller: User,
  ): Promise<SellerProductResponseDto> {
    // TODO: ProductService.updateProduct 구현 및 호출 (권한 검사 포함)
    const product = await this.productService.updateSellerProduct(seller.id, productId, updateDto);
    const responseBody = SellerProductResponseBodyDto.fromEntity(product);
    return BaseResponseV2.success(responseBody, '상품 정보가 성공적으로 수정되었습니다.');
  }
}
