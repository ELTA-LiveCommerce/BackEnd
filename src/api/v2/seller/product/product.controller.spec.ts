import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from '@/module/product/product.service';
import {
  SellerProductCreateRequestDto,
  SellerProductUpdateRequestDto,
  SellerProductListRequestDto,
} from '@/api/v2/seller/product/product.request.dto';
import {
  SellerProductResponseDto,
  SellerProductResponseBodyDto,
  SellerProductListResponseDto,
} from '@/api/v2/seller/product/product.response.dto';
import { SellerProductListItemDto } from '@/module/product/dto/seller-product-list-item.dto';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BaseResponseV2, PagedResponseV2, PagedResponseData } from '@/api/v2/common/base-response.dto';
import { SellerProductSearchField } from '@/api/v2/seller/product/search-field.enum';
import { SellerProductDateField } from '@/api/v2/seller/product/date-field.enum';

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
    it('should create a product and return success response', async () => {
      const createDto: SellerProductCreateRequestDto = {
        name: 'New Product',
        price: 100,
        stockQuantity: 10,
        description: 'Product description',
      };
      productService.createSellerProduct.mockResolvedValue(mockProduct);
      const expectedBody = SellerProductResponseBodyDto.fromEntity(mockProduct);

      const result = await controller.createProduct(createDto, mockSeller);

      expect(productService.createSellerProduct).toHaveBeenCalledWith(mockSeller.id, createDto);
      expect(result).toBeInstanceOf(BaseResponseV2);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toBe('상품이 성공적으로 등록되었습니다.');
      expect(result.data).toEqual(expectedBody);
    });
  });

  describe('updateProduct', () => {
    const productId = 'product-uuid-1';
    const updateDto: SellerProductUpdateRequestDto = { name: 'Updated Product' };

    it('should update a product and return success response', async () => {
      productService.updateSellerProduct.mockResolvedValue(mockProduct);
      const expectedBody = SellerProductResponseBodyDto.fromEntity(mockProduct);

      const result = await controller.updateProduct(productId, updateDto, mockSeller);

      expect(productService.updateSellerProduct).toHaveBeenCalledWith(mockSeller.id, productId, updateDto);
      expect(result).toBeInstanceOf(BaseResponseV2);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('상품 정보가 성공적으로 수정되었습니다.');
      expect(result.data).toEqual(expectedBody);
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
    it('should return paginated list of seller products', async () => {
      const query = new SellerProductListRequestDto();
      const sellerId = 'test-seller-id';
      const seller = { id: sellerId, role: UserRole.SELLER } as User;
      const mockProducts = [
        { id: 'prod-1', name: 'Test Product 1', price: 100, stockQuantity: 10, seller: seller } as Product,
        { id: 'prod-2', name: 'Test Product 2', price: 200, stockQuantity: 5, seller: seller } as Product,
      ];
      const pagedResultItems = mockProducts.map(SellerProductListItemDto.fromEntity);
      const mockServiceResponse = PagedResponseV2.create(
        pagedResultItems,
        mockProducts.length,
        query.page ?? 1,
        query.limit ?? 10,
        '상품 목록 조회 성공',
      );
      productService.findSellerProductsPaged.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSellerProducts(query, seller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(sellerId, query);
      expect(result).toEqual(mockServiceResponse);
      expect(result).toBeInstanceOf(PagedResponseV2);
      expect(result.data.items).toEqual(pagedResultItems);
      expect(result.data.total).toBe(mockProducts.length);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.timestamp).toEqual(expect.any(String));
    });

    it('should handle search keyword', async () => {
      const query = new SellerProductListRequestDto();
      query.searchKeyword = '캠핑';
      query.searchField = SellerProductSearchField.NAME;
      const sellerId = 'test-seller-id';
      const seller = { id: sellerId, role: UserRole.SELLER } as User;
      const mockServiceResponse = PagedResponseV2.create<SellerProductListItemDto>(
        [],
        0,
        query.page ?? 1,
        query.limit ?? 10,
        '상품 목록 조회 성공',
      );
      productService.findSellerProductsPaged.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSellerProducts(query, seller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(sellerId, query);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle date range filter', async () => {
      const query = new SellerProductListRequestDto();
      query.startDate = '2024-01-01';
      query.endDate = '2024-01-31';
      query.dateField = SellerProductDateField.CREATED_AT;
      const sellerId = 'test-seller-id';
      const seller = { id: sellerId, role: UserRole.SELLER } as User;
      const mockServiceResponse = PagedResponseV2.create<SellerProductListItemDto>(
        [],
        0,
        query.page ?? 1,
        query.limit ?? 10,
        '상품 목록 조회 성공',
      );
      productService.findSellerProductsPaged.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSellerProducts(query, seller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(sellerId, query);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle filtering by keyword and date range', async () => {
      const query: SellerProductListRequestDto = {
        searchKeyword: '테스트',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        page: 2,
        limit: 5,
      };
      const mockProductItems = [SellerProductListItemDto.fromEntity(mockProduct)];
      const mockServiceResponse = PagedResponseV2.create(
        mockProductItems,
        1,
        query.page ?? 1,
        query.limit ?? 5,
        '상품 목록 조회 성공',
      );
      productService.findSellerProductsPaged.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, query);
      expect(result).toEqual(mockServiceResponse);
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
      const mockProductItems = [SellerProductListItemDto.fromEntity(mockProduct)];
      const mockServiceResponse = PagedResponseV2.create(
        mockProductItems,
        1,
        query.page ?? 1,
        query.limit ?? 5,
        '상품 목록 조회 성공',
      );
      productService.findSellerProductsPaged.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, query);
      expect(result).toEqual(mockServiceResponse);
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
      const mockProductItems = [SellerProductListItemDto.fromEntity(mockProduct)];
      const mockServiceResponse = PagedResponseV2.create(
        mockProductItems,
        1,
        query.page ?? 1,
        query.limit ?? 5,
        '상품 목록 조회 성공',
      );
      productService.findSellerProductsPaged.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSellerProducts(query, mockSeller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(mockSeller.id, query);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should return empty list when no products match', async () => {
      const query = new SellerProductListRequestDto();
      const sellerId = 'test-seller-id';
      const seller = { id: sellerId, role: UserRole.SELLER } as User;
      const mockServiceResponse = PagedResponseV2.create<SellerProductListItemDto>(
        [],
        0,
        query.page ?? 1,
        query.limit ?? 10,
        '상품 목록 조회 성공',
      );
      productService.findSellerProductsPaged.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSellerProducts(query, seller);

      expect(productService.findSellerProductsPaged).toHaveBeenCalledWith(sellerId, query);
      expect(result).toEqual(mockServiceResponse);
      expect(result.data.items).toEqual([]);
      expect(result.data.total).toBe(0);
    });
  });

  describe('remove', () => {
    it('should call productService.remove with correct parameters and return void', async () => {
      const productId = 'test-product-id';
      const seller = new User();
      seller.id = 'seller-id';
      seller.role = UserRole.SELLER;

      productService.remove.mockResolvedValue(undefined); // ProductService.remove는 void를 반환하거나 아무것도 반환하지 않음

      // HttpCode(HttpStatus.NO_CONTENT) 이므로 undefined를 기대
      await expect(controller.remove(productId, seller)).resolves.toBeUndefined();

      expect(productService.remove).toHaveBeenCalledWith(productId, seller);
      expect(productService.remove).toHaveBeenCalledTimes(1);
    });

    // ProductService.remove에서 발생할 수 있는 예외 (e.g., ForbiddenException, NotFoundException)에 대한 테스트는
    // ProductService의 단위 테스트에서 다루어져야 합니다.
    // 컨트롤러는 서비스의 예외를 그대로 전달하는 역할을 주로 합니다.
  });
});
