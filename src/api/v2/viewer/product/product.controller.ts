import { Controller, Get, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ProductService } from '@/module/product/product.service';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { ViewerProductListRequestDto } from './product-request.dto';
import {
  ViewerProductResponseDto,
  ViewerProductListResponseDto,
  ViewerProductResponseBodyDto,
  ViewerProductDeliveryResponseDto,
  ViewerProductDeliveryResponseBodyDto,
} from './product-response.dto';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';

@ApiTags('v2/viewer/products')
@Controller('v2/viewer/products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly deliveryService: DeliveryService,
  ) {}

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

  @Get(':productId/delivery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Viewer 특정 상품 배송 조회' })
  @ApiParam({ name: 'productId', description: '상품 ID (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @ApiOkResponse({ type: ViewerProductDeliveryResponseDto })
  async findProductDelivery(
    @Param('productId', ParseUUIDPipe) productId: string,
    @GetUser() user: User,
  ): Promise<ViewerProductDeliveryResponseDto> {
    const deliveryData = await this.deliveryService.findDeliveryByProductForViewer(productId, user.id);

    if (!deliveryData) {
      // 사실상 DeliveryService에서 NotFoundException을 던지므로 여기는 실행되지 않음
      throw new Error('배송 정보를 찾을 수 없습니다.');
    }

    const responseBody = ViewerProductDeliveryResponseBodyDto.fromServiceData(deliveryData);
    return BaseResponseV2.success(responseBody, '상품 배송 정보 조회 성공');
  }
}

