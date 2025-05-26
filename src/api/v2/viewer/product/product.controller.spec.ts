import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from '@/module/product/product.service';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { ViewerProductListRequestDto, ViewerProductSortBy } from './product-request.dto';
import {
  ViewerProductResponseDto,
  ViewerProductListResponseDto,
  ViewerProductResponseBodyDto,
  ViewerProductDeliveryResponseDto,
  ViewerProductDeliveryResponseBodyDto,
} from './product-response.dto';
import { Product, ProductStatus } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { Delivery, DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('ProductController (Viewer V2)', () => {
  let controller: ProductController;
  let productService: MockProxy<ProductService>;
  let deliveryService: MockProxy<DeliveryService>;

  const mockSeller = {
    id: 'seller-uuid',
    loginId: 'seller01',
    name: '판매자1',
    role: UserRole.SELLER,
  } as User;

  const mockUser = {
    id: 'user-uuid',
    loginId: 'user01',
    name: '구매자1',
    role: UserRole.VIEWER,
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
    status: ProductStatus.DEFAULT,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product;

  const mockDelivery = {
    id: 'delivery-uuid',
    trackingNumber: '1234567890',
    courierCompany: 'CJ대한통운',
    status: DeliveryStatus.SHIPPING,
    shippedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Delivery;

  const mockDeliveryServiceResponse = {
    delivery: mockDelivery,
    product: {
      id: mockProduct.id,
      name: mockProduct.name,
      image: mockProduct.mainImage,
    },
    seller: {
      id: mockSeller.id,
      name: mockSeller.name,
    },
    orderInfo: {
      orderId: 'order-uuid',
      orderNumber: 'ORDER-001',
      quantity: 2,
      price: 10000,
      totalPrice: 20000,
      orderDate: new Date(),
    },
  };

  const mockProductResponseBody = ViewerProductResponseBodyDto.fromEntity(mockProduct);

  beforeEach(async () => {
    productService = mock<ProductService>();
    deliveryService = mock<DeliveryService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: DeliveryService, useValue: deliveryService },
      ],
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

  describe('findProductDelivery', () => {
    it('should return delivery information for a product', async () => {
      deliveryService.findDeliveryByProductForViewer.mockResolvedValue(mockDeliveryServiceResponse);

      const result = await controller.findProductDelivery(mockProduct.id, mockUser);

      expect(deliveryService.findDeliveryByProductForViewer).toHaveBeenCalledWith(mockProduct.id, mockUser.id);
      expect(result.data.delivery).toBeDefined();
      expect(result.data.delivery?.id).toBe(mockDelivery.id);
      expect(result.data.delivery?.trackingNumber).toBe(mockDelivery.trackingNumber);
      expect(result.data.delivery?.status).toBe(DeliveryStatus.SHIPPING);
      expect(result.data.product.id).toBe(mockProduct.id);
      expect(result.data.seller.id).toBe(mockSeller.id);
      expect(result.data.orderInfo.orderId).toBe('order-uuid');
      expect(result.success).toBe(true);
      expect(result.message).toBe('상품 배송 정보 조회 성공');
    });

    it('should throw NotFoundException if user did not purchase the product', async () => {
      const nonExistentProductId = 'non-existent-product-uuid';
      deliveryService.findDeliveryByProductForViewer.mockRejectedValue(
        new NotFoundException('구매하지 않은 상품이거나 존재하지 않는 상품입니다.'),
      );

      await expect(controller.findProductDelivery(nonExistentProductId, mockUser)).rejects.toThrow(NotFoundException);
      expect(deliveryService.findDeliveryByProductForViewer).toHaveBeenCalledWith(nonExistentProductId, mockUser.id);
    });

    it('should handle case when delivery has not been created yet', async () => {
      const mockDeliveryServiceResponseWithoutDelivery = {
        ...mockDeliveryServiceResponse,
        delivery: null,
      };
      deliveryService.findDeliveryByProductForViewer.mockResolvedValue(mockDeliveryServiceResponseWithoutDelivery);

      const result = await controller.findProductDelivery(mockProduct.id, mockUser);

      expect(deliveryService.findDeliveryByProductForViewer).toHaveBeenCalledWith(mockProduct.id, mockUser.id);
      expect(result.data.delivery).toBeNull();
      expect(result.data.product.id).toBe(mockProduct.id);
      expect(result.data.seller.id).toBe(mockSeller.id);
      expect(result.success).toBe(true);
    });
  });
});

