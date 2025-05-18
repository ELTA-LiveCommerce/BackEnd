import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { ProductService } from '@/module/product/product.service';
import { UserService } from '@/module/user/user.service';
import {
  AdminProductListRequest,
  AdminCreateProductRequest,
  AdminUpdateProductRequest,
} from './dto/admin-product-request.dto';
import { AdminProductResponse, AdminProductListResponse } from './dto/admin-product-response.dto';

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminProductListResponse })
  @Get()
  async getProducts(@Query() query: AdminProductListRequest): Promise<AdminProductListResponse> {
    const result = await this.productService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      category: query.category,
      sellerId: query.sellerId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return AdminProductListResponse.fromResult(result.items, result.total, query.page ?? 1, query.limit ?? 10);
  }

  @ApiOperation({ summary: '상품 상세 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminProductResponse })
  @Get(':id')
  async getProduct(@Param('id') id: string): Promise<AdminProductResponse> {
    const product = await this.productService.findOne(id);
    return AdminProductResponse.fromEntity(product);
  }

  @ApiOperation({ summary: '상품 생성' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminProductResponse })
  @Post()
  async createProduct(@Body() dto: AdminCreateProductRequest): Promise<AdminProductResponse> {
    // 판매자 정보 조회
    const seller = await this.userService.findOne(dto.sellerId);

    // AdminCreateProductRequest를 CreateProductDto로 변환
    const createProductDto = {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stockQuantity: dto.stock, // AdminCreateProductRequest의 stock을 CreateProductDto의 stockQuantity로 매핑
      shortDescription: dto.description?.substring(0, 100), // 간략 설명은 설명에서 추출
      mainImage: dto.images?.[0], // 첫 번째 이미지를 메인 이미지로 사용
      images: dto.images,
      discountPrice: dto.discountPrice,
    };

    const product = await this.productService.create(createProductDto, seller);
    return AdminProductResponse.fromEntity(product);
  }

  @ApiOperation({ summary: '상품 수정' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminProductResponse })
  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() dto: AdminUpdateProductRequest): Promise<AdminProductResponse> {
    // AdminUpdateProductRequest를 UpdateProductDto로 변환
    const updateProductDto = {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stockQuantity: dto.stock, // AdminUpdateProductRequest의 stock을 UpdateProductDto의 stockQuantity로 매핑
      shortDescription: dto.description?.substring(0, 100), // 간략 설명은 설명에서 추출
      mainImage: dto.images?.[0], // 첫 번째 이미지를 메인 이미지로 사용
      images: dto.images,
      discountPrice: dto.discountPrice,
    };

    const product = await this.productService.update(id, updateProductDto);
    return AdminProductResponse.fromEntity(product);
  }

  @ApiOperation({ summary: '상품 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteProduct(@Param('id') id: string): Promise<void> {
    await this.productService.remove(id);
  }
}

