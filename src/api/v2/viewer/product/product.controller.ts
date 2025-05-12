import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ProductService } from '@/module/product/product.service';
import { ViewerProductListRequestDto } from './product-request.dto';
import {
  ViewerProductResponseDto,
  ViewerProductListResponseDto,
  ViewerProductResponseBodyDto,
} from './product-response.dto';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Viewer - Product')
@Controller({
  path: 'viewer/products',
  version: '2',
})
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Viewer 상품 목록 조회' })
  @ApiOkResponse({ type: ViewerProductListResponseDto })
  async findAllProducts(@Query() query: ViewerProductListRequestDto): Promise<ViewerProductListResponseDto> {
    const { items, total, page, limit } = await this.productService.findAllForViewer(query);
    // Product 엔티티 목록을 ViewerProductResponseBodyDto 목록으로 변환
    const responseBodyItems = items.map((product) => ViewerProductResponseBodyDto.fromEntity(product));
    return ViewerProductListResponseDto.createPaged(responseBodyItems, total, page, limit);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Viewer 특정 상품 상세 조회' })
  @ApiParam({ name: 'productId', description: '상품 ID (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @ApiOkResponse({ type: ViewerProductResponseDto })
  async findOneProduct(@Param('productId', ParseUUIDPipe) productId: string): Promise<ViewerProductResponseDto> {
    const product = await this.productService.findOneForViewer(productId);
    // Product 엔티티를 ViewerProductResponseBodyDto로 변환
    return ViewerProductResponseDto.success(ViewerProductResponseBodyDto.fromEntity(product));
  }
}
