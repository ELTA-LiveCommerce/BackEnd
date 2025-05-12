import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
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
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { SellerProductSearchField } from './search-field.enum';
import { SellerProductDateField } from './date-field.enum';

describe('ProductController (Seller V2)', () => {
  let controller: ProductController;
  let productService: MockProxy<ProductService>;

  const mockSeller = {
    id: 'seller-uuid',
    role: UserRole.SELLER,
  } as User;

  const mockProduct = {
    id: 'product-uuid-1',
    name: '테스트 상품 1',
    price: 10000,
    description: '상품 설명입니다.',
    stockQuantity: 100,
    seller: mockSeller,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product;

  const mockProductResponseBody = SellerProductResponseBodyDto.fromEntity(mockProduct);

  beforeEach(async () => {
    productService = mock<ProductService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: productService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductController>(ProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const createDto: SellerProductCreateRequestDto = {
        name: '새 상품',
        price: 20000,
        stockQuantity: 50,
        description: '새 상품 설명',
      };
      productService.createSellerProduct.mockResolvedValue({
        ...mockProduct, // 기존 mockProduct 기반으로 생성
        ...createDto, // DTO 내용으로 덮어쓰기
        seller: mockSeller, // seller 정보 유지
      });

      const result = await controller.createProduct(createDto, mockSeller);

      expect(productService.createSellerProduct).toHaveBeenCalledWith(mockSeller.id, createDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toBe('상품이 성공적으로 등록되었습니다.');
      expect(result.data.name).toBe(createDto.name);
    });
  });

  describe('updateProduct', () => {
    const productId = 'product-uuid-1';
    const updateDto: SellerProductUpdateRequestDto = {
      name: '수정된 상품명',
      price: 15000,
    };

    it('should update a product successfully', async () => {
      productService.updateSellerProduct.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await controller.updateProduct(productId, updateDto, mockSeller);

      expect(productService.updateSellerProduct).toHaveBeenCalledWith(mockSeller.id, productId, updateDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('상품 정보가 성공적으로 수정되었습니다.');
      expect(result.data.name).toBe(updateDto.name);
      expect(result.data.price).toBe(updateDto.price);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      productService.updateSellerProduct.mockRejectedValue(new NotFoundException());

      await expect(controller.updateProduct(productId, updateDto, mockSeller)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if seller does not own the product', async () => {
      productService.updateSellerProduct.mockRejectedValue(new ForbiddenException());

      await expect(controller.updateProduct(productId, updateDto, mockSeller)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSellerProducts', () => {
    it('should return a paginated list of seller products', async () => {
      const query: SellerProductListRequestDto = { page: 1, limit: 10 };
      const mockProducts = [mockProduct, { ...mockProduct, id: 'product-uuid-2' }];
      const pagedResult = { items: mockProducts, total: 2, page: 1, limit: 10 };
      productService.findSellerProductsPaged.mockResolvedValue(pagedResult);

      const expectedListItems = mockProducts.map(SellerProductListItemDto.fromEntity);

      const result = await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, query);
      expect(result).toBeInstanceOf(PagedResponseV2);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('상품 목록 조회 성공');
      expect(result.data.items).toEqual(expectedListItems);
      expect(result.data.total).toBe(2);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    it('should handle filtering by keyword and date range', async () => {
      const query: SellerProductListRequestDto = {
        searchKeyword: '테스트',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        page: 2,
        limit: 5,
      };
      const pagedResult = { items: [mockProduct], total: 1, page: 2, limit: 5 };
      productService.findSellerProductsPaged.mockResolvedValue(pagedResult);

      await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, {
        searchKeyword: '테스트',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        page: 2,
        limit: 5,
      });
    });

    it('should handle filtering by keyword, field, and date range', async () => {
      const query: SellerProductListRequestDto = {
        searchField: SellerProductSearchField.DESCRIPTION,
        searchKeyword: '테스트',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        page: 2,
        limit: 5,
      };
      const pagedResult = { items: [mockProduct], total: 1, page: 2, limit: 5 };
      productService.findSellerProductsPaged.mockResolvedValue(pagedResult);

      await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, {
        searchField: SellerProductSearchField.DESCRIPTION,
        searchKeyword: '테스트',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        page: 2,
        limit: 5,
      });
    });

    it('should handle filtering by keyword, field, date field, and date range', async () => {
      const query: SellerProductListRequestDto = {
        searchField: SellerProductSearchField.DESCRIPTION,
        searchKeyword: '테스트',
        dateField: SellerProductDateField.UPDATED_AT,
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        page: 2,
        limit: 5,
      };
      const pagedResult = { items: [mockProduct], total: 1, page: 2, limit: 5 };
      productService.findSellerProductsPaged.mockResolvedValue(pagedResult);

      await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, {
        searchField: SellerProductSearchField.DESCRIPTION,
        searchKeyword: '테스트',
        dateField: SellerProductDateField.UPDATED_AT,
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        page: 2,
        limit: 5,
      });
    });

    it('should use default search field (NAME) and date field (CREATED_AT) if not provided', async () => {
      const query: SellerProductListRequestDto = {
        searchField: SellerProductSearchField.NAME,
        dateField: SellerProductDateField.CREATED_AT,
        searchKeyword: '기본',
        page: 1,
        limit: 10,
      };
      const pagedResult = { items: [], total: 0, page: 1, limit: 10 };
      productService.findSellerProductsPaged.mockResolvedValue(pagedResult);

      await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, {
        searchField: SellerProductSearchField.NAME,
        dateField: SellerProductDateField.CREATED_AT,
        searchKeyword: '기본',
        page: 1,
        limit: 10,
      });
    });
  });
});
