import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ProductService } from '@/module/product/product.service';
import { ViewerProductListRequestDto } from './product-request.dto';
import {
  ViewerProductResponseDto,
  ViewerProductListResponseDto,
  ViewerProductResponseBodyDto,
} from './product-response.dto';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

@ApiTags('Viewer - Product')
@Controller('v2/viewer/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Viewer 상품 목록 조회' })
  @ApiOkResponse({ type: ViewerProductListResponseDto })
  async findAllProducts(@Query() query: ViewerProductListRequestDto): Promise<ViewerProductListResponseDto> {
    const { items, total, page, limit } = await this.productService.findAllForViewer(query);
    const responseBodyItems = items.map((product) => ViewerProductResponseBodyDto.fromEntity(product));
    return PagedResponseV2.create(responseBodyItems, total, page, limit, '상품 목록 조회 성공');
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Viewer 특정 상품 상세 조회' })
  @ApiParam({ name: 'productId', description: '상품 ID (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @ApiOkResponse({ type: ViewerProductResponseDto })
  async findOneProduct(@Param('productId', ParseUUIDPipe) productId: string): Promise<ViewerProductResponseDto> {
    const product = await this.productService.findOneForViewer(productId);
    const responseBody = ViewerProductResponseBodyDto.fromEntity(product);
    return BaseResponseV2.success(responseBody, '상품 상세 정보입니다.');
  }
}
