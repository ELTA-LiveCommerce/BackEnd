import { Test, TestingModule } from '@nestjs/testing';

import { ProductController } from '@/api/product/product.controller';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

// Express.Multer.File에 대한 간단한 mock 타입 정의
type MockFile = Partial<Express.Multer.File>;

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;

  const mockProductService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findProductsBySeller: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result: Product[] = [
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
      mockProductService.findAll.mockResolvedValue(result);
      expect(await controller.findAll()).toBe(result);
      expect(() => productService.findAll()).not.toThrow();
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
      mockProductService.findOne.mockResolvedValue(result);
      expect(await controller.findOne(productId)).toBe(result);
      expect(() => productService.findOne(productId)).not.toThrow();
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
      mockProductService.findProductsBySeller.mockResolvedValue(mockResult);

      const products = await controller.findProductsBySeller(sellerId);

      expect(products).toEqual(mockResult);
      expect(() => productService.findProductsBySeller(sellerId)).not.toThrow();
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

      const mockUser = {
        id: 'seller1',
        email: 'seller@example.com',
        name: 'Seller',
        role: UserRole.SELLER,
        password: 'password',
        isVerified: true,
      } as User;

      const mockReq = { user: mockUser };

      const result: Product = {
        id: '2',
        ...createProductDto,
        seller: mockUser as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Product;

      mockProductService.create.mockResolvedValue(result);
      expect(
        await controller.create(
          mockFile as Express.Multer.File,
          [mockFile as Express.Multer.File],
          createProductDto,
          mockReq,
        ),
      ).toBe(result);
      expect(() => productService.create(createProductDto, mockReq.user)).not.toThrow();
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

      mockProductService.update.mockResolvedValue(result);
      expect(
        await controller.update(
          productId,
          mockFile as Express.Multer.File,
          [mockFile as Express.Multer.File],
          updateProductDto,
        ),
      ).toBe(result);
      expect(() => productService.update(productId, updateProductDto)).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = '1';
      mockProductService.remove.mockResolvedValue(undefined);
      await controller.remove(productId);
      expect(() => productService.remove(productId)).not.toThrow();
    });
  });
});
