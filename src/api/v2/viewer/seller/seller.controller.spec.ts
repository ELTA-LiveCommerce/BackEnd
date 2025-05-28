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
} from './seller-request.dto';
import {
  SellerSearchResponseDto,
  SellerInfoResponseDto,
  SellerLiveResponseDto,
  SellerProductResponseDto,
  SellerInfoDto,
  SellerLivePageDto,
  SellerProductPageDto,
  SellerLiveItemDto,
  SellerProductItemDto,
  SellerFollowResponseDto,
} from './seller-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { PagedResponseV2, PagedResponseData } from '@/api/v2/common/base-response.dto';
import { UserRole } from '@/shared/enum/user-role.enum';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthGuard } from '@nestjs/passport';
import { UserFollowService } from '@/module/user/user-follow.service';

describe('SellerController', () => {
  let controller: SellerController;
  let userService: MockProxy<UserService>;
  let broadcastService: MockProxy<BroadcastService>;
  let productService: MockProxy<ProductService>;
  let userFollowService: MockProxy<UserFollowService>;

  const mockSellerUser = {
    id: 'test-seller-id',
    loginId: 'sellerLoginId',
    name: 'Test Seller',
    profileImage: 'http://example.com/seller.jpg',
    role: UserRole.SELLER,
    password: 'hashedPassword',
    isVerified: true,
  } as unknown as User;

  beforeEach(async () => {
    userService = mock<UserService>();
    broadcastService = mock<BroadcastService>();
    productService = mock<ProductService>();
    userFollowService = mock<UserFollowService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: BroadcastService, useValue: broadcastService },
        { provide: ProductService, useValue: productService },
        { provide: UserFollowService, useValue: userFollowService },
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

      const expectedResponseData = {
        data: [
          {
            id: mockSellerUser.id,
            username: mockSellerUser.loginId,
            name: mockSellerUser.name || mockSellerUser.loginId,
            profileImage: mockSellerUser.profileImage,
          },
        ],
        message: '판매자 검색 결과입니다.',
        statusCode: 200,
        success: true,
      };

      const result = await controller.searchSellers(query);
      expect(userService.findByUsernameContaining).toHaveBeenCalledWith(query.keyword, UserRole.SELLER, query.limit);
      expect(result).toEqual(expect.objectContaining(expectedResponseData));
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });

  describe('getSellerInfo', () => {
    const mockCurrentUser = {
      id: 'test-user-id',
      loginId: 'testUser',
      name: 'Test User',
    } as User;

    const mockFollowers = [
      {
        id: 'follower-1',
        name: 'Follower 1',
        loginId: 'follower1',
        profileImage: 'http://example.com/follower1.jpg',
        isFollowing: false,
      },
      {
        id: 'follower-2',
        name: 'Follower 2',
        loginId: 'follower2',
        profileImage: 'http://example.com/follower2.jpg',
        isFollowing: true,
      },
    ];

    const mockFollowing = [
      {
        id: 'following-1',
        name: 'Following 1',
        loginId: 'following1',
        profileImage: 'http://example.com/following1.jpg',
      },
    ];

    it('should return seller information with follow status and follower count', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerInfoRequestDto = {};
      const mockBusinessInfo = {
        businessName: 'ABC 상사',
        businessAddress: '서울시 강남구 테헤란로 123',
        businessNumber: '123-45-67890',
      };

      userService.findOne.mockResolvedValue(mockSellerUser);
      userService.getSellerInfo.mockResolvedValue(mockBusinessInfo);
      userFollowService.getFollowCounts.mockResolvedValue({
        followersCount: mockFollowers.length,
        followingCount: mockFollowing.length,
      });
      userFollowService.isFollowing.mockResolvedValue(true);

      const expectedSellerInfo: SellerInfoDto = {
        id: mockSellerUser.id,
        name: mockSellerUser.name as string,
        loginId: mockSellerUser.loginId,
        profileImage: mockSellerUser.profileImage,
        description: '셀러 소개입니다.',
        followers: mockFollowers.length,
        following: mockFollowing.length,
        isFollowing: true,
        businessName: 'ABC 상사',
        businessAddress: '서울시 강남구 테헤란로 123',
        businessNumber: '123-45-67890',
      };
      const expectedResponse = SellerInfoResponseDto.success(expectedSellerInfo);

      const result = await controller.getSellerInfo(sellerId, query, mockCurrentUser);
      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(userService.getSellerInfo).toHaveBeenCalledWith(sellerId);
      expect(userFollowService.getFollowCounts).toHaveBeenCalledWith(sellerId);
      expect(userFollowService.isFollowing).toHaveBeenCalledWith(mockCurrentUser.id, sellerId);
      expect(result).toMatchObject({
        ...expectedResponse,
        timestamp: expect.any(String),
      });
    });

    it('should return isFollowing as false when not following', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerInfoRequestDto = {};

      userService.findOne.mockResolvedValue(mockSellerUser);
      userService.getSellerInfo.mockResolvedValue({
        businessName: 'ABC 상사',
        businessAddress: undefined,
        businessNumber: undefined,
      });
      userFollowService.getFollowCounts.mockResolvedValue({
        followersCount: mockFollowers.length,
        followingCount: mockFollowing.length,
      });
      userFollowService.isFollowing.mockResolvedValue(false);

      const result = await controller.getSellerInfo(sellerId, query, mockCurrentUser);
      expect(result.data.isFollowing).toBe(false);
      expect(result.data.businessName).toBe('ABC 상사');
      expect(result.data.businessAddress).toBeUndefined();
      expect(result.data.businessNumber).toBeUndefined();
    });

    it('should throw NotFoundException if seller not found', async () => {
      const sellerId = 'non-existent-id';
      const query: SellerInfoRequestDto = {};
      userService.findOne.mockResolvedValue(null as any);

      await expect(controller.getSellerInfo(sellerId, query, mockCurrentUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle non-authenticated users and set isFollowing to false', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerInfoRequestDto = {};

      userService.findOne.mockResolvedValue(mockSellerUser);
      userService.getSellerInfo.mockResolvedValue({
        businessName: 'Test Business',
        businessAddress: '테스트 주소',
        businessNumber: '000-00-00000',
      });
      userFollowService.getFollowCounts.mockResolvedValue({
        followersCount: mockFollowers.length,
        followingCount: mockFollowing.length,
      });

      const result = await controller.getSellerInfo(sellerId, query, null as any);

      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(userService.getSellerInfo).toHaveBeenCalledWith(sellerId);
      expect(userFollowService.getFollowCounts).toHaveBeenCalledWith(sellerId);
      expect(userFollowService.isFollowing).not.toHaveBeenCalled();
      expect(result.data.isFollowing).toBe(false);
      expect(result.data.businessName).toBe('Test Business');
    });

    it('should handle missing business info gracefully', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerInfoRequestDto = {};

      userService.findOne.mockResolvedValue(mockSellerUser);
      userService.getSellerInfo.mockRejectedValue(new Error('No business info found'));
      userFollowService.getFollowCounts.mockResolvedValue({
        followersCount: mockFollowers.length,
        followingCount: mockFollowing.length,
      });
      userFollowService.isFollowing.mockResolvedValue(false);

      const result = await controller.getSellerInfo(sellerId, query, mockCurrentUser);

      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(userService.getSellerInfo).toHaveBeenCalledWith(sellerId);
      expect(result.data.businessName).toBeUndefined();
      expect(result.data.businessAddress).toBeUndefined();
      expect(result.data.businessNumber).toBeUndefined();
    });
  });

  describe('getSellerLives', () => {
    it('should return a paged list of seller lives (BroadcastListItemDto)', async () => {
      const sellerId = 'test-seller-id';
      const query = { page: 1, limit: 10 };
      const mockSeller = { id: sellerId } as User;

      const mockItems: BroadcastListItemDto[] = [
        new BroadcastListItemDto({
          id: 'b1',
          title: 'Test Broadcast 1',
          thumbnailUrl: 'http://example.com/broadcast1.jpg',
          status: 'LIVE',
          scheduledAt: new Date(),
          products: [],
          isLive: true,
        }),
        new BroadcastListItemDto({
          id: 'b2',
          title: 'Test Broadcast 2',
          thumbnailUrl: 'http://example.com/broadcast2.jpg',
          status: 'LIVE',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          products: [],
          isLive: true,
        }),
      ];

      const mockPagedResults = new PagedResponseV2(mockItems, 2, 1, 10);

      userService.findOne.mockResolvedValue(mockSeller);
      broadcastService.findSellerBroadcastsForViewer.mockResolvedValue(mockPagedResults);

      const result = await controller.getSellerLives(sellerId, query);

      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(broadcastService.findSellerBroadcastsForViewer).toHaveBeenCalledWith(sellerId, query);
      expect(result).toEqual(mockPagedResults);

      result.data.items.forEach((broadcast) => {
        expect(broadcast.isLive).toBe(true);
      });
    });

    it('should use viewer-specific method to exclude ended broadcasts', async () => {
      const sellerId = 'test-seller-id';
      const query = { page: 1, limit: 10 };
      const mockSeller = { id: sellerId } as User;

      userService.findOne.mockResolvedValue(mockSeller);
      broadcastService.findSellerBroadcastsForViewer.mockResolvedValue(new PagedResponseV2([], 0, 1, 10));

      await controller.getSellerLives(sellerId, query);

      expect(broadcastService.findSellerBroadcastsForViewer).toHaveBeenCalledWith(sellerId, query);

      expect(broadcastService.findSellerBroadcastsPaged).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if seller not found', async () => {
      const sellerId = 'non-existent-id';
      const query: SellerLiveRequestDto = { page: 1, limit: 10 };
      userService.findOne.mockRejectedValue(new NotFoundException(`Seller with ID "${sellerId}" not found`));

      await expect(controller.getSellerLives(sellerId, query)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSellerProducts', () => {
    it('should return a list of products by the seller', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerProductRequestDto = { page: 1, limit: 10 };
      const mockProducts = [
        {
          id: 'test-product-1',
          name: 'Product 1',
          price: 10000,
          mainImage: 'http://example.com/product1.jpg',
          shortDescription: 'Description 1',
          stockQuantity: 100,
        },
        {
          id: 'test-product-2',
          name: 'Product 2',
          price: 20000,
          mainImage: 'http://example.com/product2.jpg',
          shortDescription: 'Description 2',
          stockQuantity: 50,
        },
      ] as Product[];

      productService.findProductsBySeller.mockResolvedValue(mockProducts);
      productService.getProductSalesCount.mockResolvedValue(10);

      // 모의 응답 아이템 생성
      const expectedItems = mockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        thumbnailImage: product.mainImage,
        description: product.shortDescription,
        stock: product.stockQuantity,
        salesCount: 10,
      }));
      const expectedResponseData = {
        data: expectedItems,
        message: '판매자 상품 목록입니다.',
        statusCode: 200,
        success: true,
      };

      const result = await controller.getSellerProducts(sellerId, query);
      expect(result).toMatchObject(expectedResponseData);
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });

  describe('followSeller', () => {
    const mockCurrentUser = {
      id: 'test-user-id',
      loginId: 'testUser',
      name: 'Test User',
      role: UserRole.VIEWER,
    } as User;

    it('should follow a seller successfully', async () => {
      const sellerId = 'test-seller-id';
      const mockFollow = {
        id: 'follow-id-1',
        follower: mockCurrentUser,
        following: mockSellerUser,
        isNotified: false,
      };

      userFollowService.followUser.mockResolvedValue(mockFollow as any);

      const result = await controller.followSeller(sellerId, mockCurrentUser);

      expect(userFollowService.followUser).toHaveBeenCalledWith(mockCurrentUser.id, sellerId);
      expect(result.success).toBe(true);
      expect(result.data.isFollowing).toBe(true);
      expect(result.message).toBe('판매자 팔로우를 성공했습니다.');
    });

    it('should throw NotFoundException if seller not found', async () => {
      const sellerId = 'non-existent-id';
      userFollowService.followUser.mockRejectedValue(new NotFoundException('팔로우하려는 사용자를 찾을 수 없습니다.'));

      await expect(controller.followSeller(sellerId, mockCurrentUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to follow self', async () => {
      const selfId = 'test-user-id';
      userFollowService.followUser.mockRejectedValue(new BadRequestException('자기 자신을 팔로우할 수 없습니다.'));

      await expect(controller.followSeller(selfId, mockCurrentUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if already following', async () => {
      const sellerId = 'test-seller-id';
      userFollowService.followUser.mockRejectedValue(new ConflictException('이미 팔로우하고 있는 사용자입니다.'));

      await expect(controller.followSeller(sellerId, mockCurrentUser)).rejects.toThrow(ConflictException);
    });
  });

  describe('unfollowSeller', () => {
    const mockCurrentUser = {
      id: 'test-user-id',
      loginId: 'testUser',
      name: 'Test User',
      role: UserRole.VIEWER,
    } as User;

    it('should unfollow a seller successfully', async () => {
      const sellerId = 'test-seller-id';
      userFollowService.unfollowUser.mockResolvedValue(undefined);

      const result = await controller.unfollowSeller(sellerId, mockCurrentUser);

      expect(userFollowService.unfollowUser).toHaveBeenCalledWith(mockCurrentUser.id, sellerId);
      expect(result.success).toBe(true);
      expect(result.data.isFollowing).toBe(false);
      expect(result.message).toBe('판매자 팔로우를 취소했습니다.');
    });

    it('should throw NotFoundException if follow relationship not found', async () => {
      const sellerId = 'non-existent-id';
      userFollowService.unfollowUser.mockRejectedValue(new NotFoundException('팔로우 관계를 찾을 수 없습니다.'));

      await expect(controller.unfollowSeller(sellerId, mockCurrentUser)).rejects.toThrow(NotFoundException);
    });
  });
});

