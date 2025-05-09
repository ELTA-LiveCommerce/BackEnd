import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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

@Controller('products')
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
   * ID로 상품을 조회합니다.
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
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
   * 새 상품을 생성합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
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
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10, productStorage), FileInterceptor('mainImage', productStorage))
  update(
    @Param('id') id: string,
    @UploadedFile() mainImageFile: Express.Multer.File,
    @UploadedFiles() imagesFiles: Express.Multer.File[],
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (mainImageFile) {
      updateProductDto.mainImage = `/uploads/products/${mainImageFile.filename}`;
    }
    if (imagesFiles && imagesFiles.length > 0) {
      updateProductDto.images = imagesFiles.map((file) => `/uploads/products/${file.filename}`);
    }
    return this.productService.update(id, updateProductDto);
  }

  /**
   * 상품을 삭제합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.productService.remove(id);
  }
}
