import { Test, TestingModule } from '@nestjs/testing';
import { SellerController } from './seller.controller';
import { UserService } from '@/module/user/user.service';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Product } from '@/module/product/entity/product.entity';
import {
  SellerSearchRequestDto,
  SellerInfoRequestDto,
  SellerLiveRequestDto,
  SellerProductRequestDto,
  SellerSearchResponseDto,
  SellerInfoResponseDto,
  SellerLiveResponseDto,
  SellerProductResponseDto,
  SellerInfoDto,
  SellerLivePageDto,
  SellerProductPageDto,
} from './seller.dto';
import { UserRole, UserStatus } from '@/shared/enum/user.enum';
import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthGuard } from '@nestjs/passport';

describe('SellerController', () => {
  let controller: SellerController;
  let userService: MockProxy<UserService>;
  let broadcastService: MockProxy<BroadcastService>;
  let productService: MockProxy<ProductService>;

  const mockSellerUser = {
    id: 'test-seller-id',
    loginId: 'sellerLoginId',
    name: 'Test Seller',
    profileImage: 'http://example.com/seller.jpg',
    role: UserRole.SELLER,
    status: UserStatus.ACTIVE,
    password: 'hashedPassword',
    isVerified: true,
  } as unknown as User;

  beforeEach(async () => {
    userService = mock<UserService>();
    broadcastService = mock<BroadcastService>();
    productService = mock<ProductService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: BroadcastService, useValue: broadcastService },
        { provide: ProductService, useValue: productService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SellerController>(SellerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchSellers', () => {
    it('should return a list of sellers based on keyword', async () => {
      const query: SellerSearchRequestDto = { keyword: 'test', limit: 5 };
      const mockSellers = [mockSellerUser];
      userService.findByUsernameContaining.mockResolvedValue(mockSellers);

      const expectedResponse = SellerSearchResponseDto.success([
        {
          id: mockSellerUser.id,
          username: mockSellerUser.loginId,
          name: mockSellerUser.name || mockSellerUser.loginId,
          profileImage: mockSellerUser.profileImage,
        },
      ]);

      const result = await controller.searchSellers(query);
      expect(userService.findByUsernameContaining).toHaveBeenCalledWith(query.keyword, UserRole.SELLER, query.limit);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSellerInfo', () => {
    it('should return seller information', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerInfoRequestDto = {};
      userService.findOne.mockResolvedValue(mockSellerUser);

      const expectedSellerInfo: SellerInfoDto = {
        id: mockSellerUser.id,
        name: mockSellerUser.name as string,
        loginId: mockSellerUser.loginId,
        profileImage: mockSellerUser.profileImage,
        description: '셀러 소개입니다.',
        followers: 0,
        following: 0,
      };
      const expectedResponse = SellerInfoResponseDto.success(expectedSellerInfo);

      const result = await controller.getSellerInfo(sellerId, query);
      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NotFoundException if seller not found', async () => {
      const sellerId = 'non-existent-id';
      const query: SellerInfoRequestDto = {};
      userService.findOne.mockResolvedValue(null as any);

      await expect(controller.getSellerInfo(sellerId, query)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSellerLives', () => {
    it('should return a paginated list of seller lives', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerLiveRequestDto = { page: 1, limit: 10 };
      const mockBroadcasts = [
        {
          id: 'b1',
          title: 'Live 1',
          thumbnailImage: 'img1.jpg',
          scheduledDate: new Date(),
          isLive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          seller: mockSellerUser,
          products: [],
        },
        {
          id: 'b2',
          title: 'Live 2',
          thumbnailImage: 'img2.jpg',
          scheduledDate: new Date(),
          isLive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          seller: mockSellerUser,
          products: [],
        },
      ] as unknown as Broadcast[];
      broadcastService.findBySellerId.mockResolvedValue(mockBroadcasts);

      const expectedItems = mockBroadcasts.map((b) => ({
        id: b.id,
        title: b.title,
        thumbnailImage: b.thumbnailImage,
        viewerCount: 0,
        startedAt: b.scheduledDate,
        status: b.isLive ? 'LIVE' : 'SCHEDULED',
      }));
      const expectedPageDto: SellerLivePageDto = {
        items: expectedItems,
        total: mockBroadcasts.length,
        page: query.page as number,
        limit: query.limit as number,
        totalPages: Math.ceil(mockBroadcasts.length / (query.limit as number)),
      };
      const expectedResponse = SellerLiveResponseDto.success(expectedPageDto);

      const result = await controller.getSellerLives(sellerId, query);
      expect(broadcastService.findBySellerId).toHaveBeenCalledWith(sellerId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSellerProducts', () => {
    it('should return a paginated list of seller products', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerProductRequestDto = { page: 1, limit: 10 };
      const mockProducts = [
        {
          id: 'p1',
          name: 'Product 1',
          price: 1000,
          mainImage: 'prod1.jpg',
          shortDescription: 'Desc 1',
          stockQuantity: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          seller: mockSellerUser,
          category: { id: 'cat1', name: 'Category1' },
          qas: [],
          reviews: [],
          orderItems: [],
          productLikes: [],
        },
        {
          id: 'p2',
          name: 'Product 2',
          price: 2000,
          mainImage: 'prod2.jpg',
          shortDescription: 'Desc 2',
          stockQuantity: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          seller: mockSellerUser,
          category: { id: 'cat2', name: 'Category2' },
          qas: [],
          reviews: [],
          orderItems: [],
          productLikes: [],
        },
      ] as unknown as Product[];
      productService.findProductsBySeller.mockResolvedValue(mockProducts);

      const expectedItems = mockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        thumbnailImage: p.mainImage,
        description: p.shortDescription,
        stock: p.stockQuantity,
        salesCount: 0,
        rating: 0,
      }));
      const expectedPageDto: SellerProductPageDto = {
        items: expectedItems,
        total: mockProducts.length,
        page: query.page as number,
        limit: query.limit as number,
        totalPages: Math.ceil(mockProducts.length / (query.limit as number)),
      };
      const expectedResponse = SellerProductResponseDto.success(expectedPageDto);

      const result = await controller.getSellerProducts(sellerId, query);
      expect(productService.findProductsBySeller).toHaveBeenCalledWith(sellerId);
      expect(result).toEqual(expectedResponse);
    });
  });
});
