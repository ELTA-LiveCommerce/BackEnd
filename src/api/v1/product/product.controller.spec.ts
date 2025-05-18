import { Test, TestingModule } from '@nestjs/testing';

import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto, UpdateProductDiscountDto } from '@/module/product/dto/update-product.dto';
import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

import { ProductController } from './product.controller';

// Express.Multer.File에 대한 간단한 mock 타입 정의
type MockFile = Partial<Express.Multer.File>;

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockFile: MockFile = {
    fieldname: 'test',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: './uploads/products',
    filename: 'test-mock.jpg',
    path: './uploads/products/test-mock.jpg',
    buffer: Buffer.from('test'),
  };

  const mockUser = {
    id: 'seller1',
    loginId: 'seller@example.com',
    name: 'Seller',
    role: UserRole.SELLER,
    password: 'password',
    isVerified: true,
  } as any;

  const mockReq = { user: mockUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findProductsBySeller: jest.fn(),
            getSellerProductList: jest.fn(),
            getSellerProductDetail: jest.fn(),
            setProductDiscount: jest.fn(),
            removeProductDiscount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const products = [
        {
          id: '1',
          name: 'Test Product',
          price: 100,
          seller: { id: 'seller1' } as any,
          description: 'Product description',
          stockQuantity: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Product,
      ];

      // 페이징된 결과를 반환하도록 mock 설정
      const result = { items: products, total: products.length };
      jest.spyOn(service, 'findAll').mockResolvedValue(result);

      const response = await controller.findAll();
      expect(response).toBe(result);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      const productId = '1';
      const result: Product = {
        id: productId,
        name: 'Test Product',
        price: 100,
        seller: { id: 'seller1' } as any,
        description: 'Product description',
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Product;
      jest.spyOn(service, 'findOne').mockResolvedValue(result);
      expect(await controller.findOne(productId)).toBe(result);
      expect(() => service.findOne(productId)).not.toThrow();
    });
  });

  describe('findProductsBySeller', () => {
    it('should return products for a given sellerId', async () => {
      const sellerId = 'seller-abc';
      const mockResult: Product[] = [
        {
          id: 'prod-1',
          name: 'Product A',
          seller: { id: sellerId } as any,
          description: 'Product A description',
          price: 100,
          stockQuantity: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Product,
        {
          id: 'prod-2',
          name: 'Product B',
          seller: { id: sellerId } as any,
          description: 'Product B description',
          price: 200,
          stockQuantity: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Product,
      ];
      jest.spyOn(service, 'findProductsBySeller').mockResolvedValue(mockResult);

      const products = await controller.findProductsBySeller(sellerId);

      expect(products).toEqual(mockResult);
      expect(() => service.findProductsBySeller(sellerId)).not.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        price: 200,
        stockQuantity: 10,
        description: 'desc',
      };

      const result: Product = {
        id: '2',
        ...createProductDto,
        seller: mockUser as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Product;

      jest.spyOn(service, 'create').mockResolvedValue(result);
      expect(
        await controller.create(
          mockFile as Express.Multer.File,
          [mockFile as Express.Multer.File],
          createProductDto,
          mockReq,
        ),
      ).toBe(result);
      expect(() => service.create(createProductDto, mockReq.user)).not.toThrow();
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = '1';
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };
      const result: Product = {
        id: productId,
        name: 'Updated Product',
        price: 100,
        seller: { id: 'seller1' } as any,
        stockQuantity: 10,
        description: 'desc',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Product;

      jest.spyOn(service, 'update').mockResolvedValue(result);
      expect(
        await controller.update(
          productId,
          mockFile as Express.Multer.File,
          [mockFile as Express.Multer.File],
          updateProductDto,
          mockReq,
        ),
      ).toBe(result);
      expect(() => service.update(productId, updateProductDto)).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = '1';
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      await controller.remove(productId, mockReq);
      expect(() => service.remove(productId)).not.toThrow();
    });
  });

  describe('setDiscount', () => {
    it('should set discount price for a product', async () => {
      const productId = '1';
      const updateProductDiscountDto: UpdateProductDiscountDto = { discountPrice: 80 };
      const result: Product = {
        id: productId,
        name: 'Test Product',
        price: 100,
        discountPrice: 80,
        seller: { id: 'seller1' } as any,
        stockQuantity: 10,
        description: 'desc',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Product;

      jest.spyOn(service, 'setProductDiscount').mockResolvedValue(result);
      expect(await controller.setDiscount(productId, updateProductDiscountDto, mockReq)).toBe(result);
      expect(() =>
        service.setProductDiscount(productId, updateProductDiscountDto.discountPrice, mockReq.user),
      ).not.toThrow();
    });
  });

  describe('removeDiscount', () => {
    it('should remove discount from a product', async () => {
      const productId = '1';
      const result: Product = {
        id: productId,
        name: 'Test Product',
        price: 100,
        discountPrice: undefined,
        seller: { id: 'seller1' } as any,
        stockQuantity: 10,
        description: 'desc',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Product;

      jest.spyOn(service, 'removeProductDiscount').mockResolvedValue(result);
      expect(await controller.removeDiscount(productId, mockReq)).toBe(result);
      expect(() => service.removeProductDiscount(productId, mockReq.user)).not.toThrow();
    });
  });
});

