import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { GetProductListDto } from '@/module/product/dto/get-product-list.dto';
import { ProductListItemDto } from '@/module/product/dto/product-list-item.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

const UPLOAD_PATH = './uploads/products'; // 실제 운영 환경에서는 S3 등 외부 스토리지 사용 권장

export const productStorage = {
  storage: diskStorage({
    destination: UPLOAD_PATH,
    filename: (req, file, cb) => {
      const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + '-' + uuidv4();
      const extension: string = path.parse(file.originalname).ext;
      cb(null, `${filename}${extension}`);
    },
  }),
};

@Controller('v1/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 모든 상품 목록을 조회합니다.
   */
  @Get()
  findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  /**
   * 셀러가 자신의 상품 목록을 조회합니다.
   * 셀러 권한이 필요합니다.
   */
  @Get('seller/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getSellerProducts(@Query() getProductListDto: GetProductListDto, @Request() req): Promise<ProductListItemDto[]> {
    return this.productService.getSellerProductList(getProductListDto, req.user);
  }

  /**
   * 셀러가 자신의 상품 상세 정보를 조회합니다.
   * 셀러 권한이 필요합니다.
   */
  @Get('seller/detail/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getSellerProductDetail(@Param('id') id: string, @Request() req): Promise<Product> {
    return this.productService.getSellerProductDetail(id, req.user);
  }

  /**
   * 특정 판매자의 모든 상품 목록을 조회합니다.
   * @param sellerId 판매자 ID
   */
  @Get('seller/:sellerId')
  findProductsBySeller(@Param('sellerId') sellerId: string): Promise<Product[]> {
    return this.productService.findProductsBySeller(sellerId);
  }

  /**
   * ID로 상품을 조회합니다.
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  /**
   * 새 상품을 생성합니다.
   * 셀러 권한이 필요합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FilesInterceptor('images', 10, productStorage), FileInterceptor('mainImage', productStorage))
  create(
    @UploadedFile() mainImageFile: Express.Multer.File,
    @UploadedFiles() imagesFiles: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
    @Request() req,
  ): Promise<Product> {
    if (mainImageFile) {
      createProductDto.mainImage = `/uploads/products/${mainImageFile.filename}`;
    }
    if (imagesFiles && imagesFiles.length > 0) {
      createProductDto.images = imagesFiles.map((file) => `/uploads/products/${file.filename}`);
    }
    return this.productService.create(createProductDto, req.user);
  }

  /**
   * 상품을 업데이트합니다.
   * 셀러 권한이 필요하며, 자신의 상품만 수정할 수 있습니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FilesInterceptor('images', 10, productStorage), FileInterceptor('mainImage', productStorage))
  update(
    @Param('id') id: string,
    @UploadedFile() mainImageFile: Express.Multer.File,
    @UploadedFiles() imagesFiles: Express.Multer.File[],
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
  ): Promise<Product> {
    if (mainImageFile) {
      updateProductDto.mainImage = `/uploads/products/${mainImageFile.filename}`;
    }
    if (imagesFiles && imagesFiles.length > 0) {
      updateProductDto.images = imagesFiles.map((file) => `/uploads/products/${file.filename}`);
    }
    return this.productService.update(id, updateProductDto, req.user);
  }

  /**
   * 상품을 삭제합니다.
   * 셀러 권한이 필요하며, 자신의 상품만 삭제할 수 있습니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.productService.remove(id, req.user);
  }
}
