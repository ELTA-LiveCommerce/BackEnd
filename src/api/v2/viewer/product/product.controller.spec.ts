import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from '@/module/product/product.service';
import { ViewerProductListRequestDto, ViewerProductSortBy } from './product-request.dto';
import {
  ViewerProductResponseDto,
  ViewerProductListResponseDto,
  ViewerProductResponseBodyDto,
} from './product-response.dto';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('ProductController (Viewer V2)', () => {
  let controller: ProductController;
  let productService: MockProxy<ProductService>;

  const mockSeller = {
    id: 'seller-uuid',
    loginId: 'seller01',
    name: '판매자1',
    role: UserRole.SELLER,
  } as User;

  const mockProduct = {
    id: 'product-uuid-1',
    name: '테스트 상품 1',
    price: 10000,
    description: '상품 설명입니다.',
    stockQuantity: 100,
    seller: mockSeller,
    mainImage: 'image.png',
    shortDescription: '짧은 설명',
    category: { id: 'cat-uuid', name: '카테고리1' } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product;

  const mockProductResponseBody = ViewerProductResponseBodyDto.fromEntity(mockProduct);

  beforeEach(async () => {
    productService = mock<ProductService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllProducts', () => {
    it('should return a paginated list of products', async () => {
      const query: ViewerProductListRequestDto = { page: 1, limit: 10, sortBy: ViewerProductSortBy.POPULARITY };
      const pagedResult = { items: [mockProduct], total: 1, page: 1, limit: 10 };
      productService.findAllForViewer.mockResolvedValue(pagedResult);

      const result = await controller.findAllProducts(query);

      expect(productService.findAllForViewer).toHaveBeenCalledWith(query);
      expect(result.data.items).toEqual([mockProductResponseBody]);
      expect(result.data.total).toBe(1);
      expect(result.success).toBe(true);
    });
  });

  describe('findOneProduct', () => {
    it('should return a single product', async () => {
      productService.findOneForViewer.mockResolvedValue(mockProduct);

      const result = await controller.findOneProduct(mockProduct.id);

      expect(productService.findOneForViewer).toHaveBeenCalledWith(mockProduct.id);
      expect(result.data).toEqual(mockProductResponseBody);
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if product is not found', async () => {
      const nonExistentId = 'non-existent-uuid';
      productService.findOneForViewer.mockRejectedValue(new NotFoundException());

      await expect(controller.findOneProduct(nonExistentId)).rejects.toThrow(NotFoundException);
    });
  });
});
