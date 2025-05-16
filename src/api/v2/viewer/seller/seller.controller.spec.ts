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
} from './seller-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { PagedResponseV2, PagedResponseData } from '@/api/v2/common/base-response.dto';
import { UserRole } from '@/shared/enum/user-role.enum';
import { NotFoundException } from '@nestjs/common';
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
      userService.findOne.mockResolvedValue(mockSellerUser);
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
      };
      const expectedResponse = SellerInfoResponseDto.success(expectedSellerInfo);

      const result = await controller.getSellerInfo(sellerId, query, mockCurrentUser);
      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
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
      userFollowService.getFollowCounts.mockResolvedValue({
        followersCount: mockFollowers.length,
        followingCount: mockFollowing.length,
      });
      userFollowService.isFollowing.mockResolvedValue(false);

      const result = await controller.getSellerInfo(sellerId, query, mockCurrentUser);
      expect(result.data.isFollowing).toBe(false);
    });

    it('should throw NotFoundException if seller not found', async () => {
      const sellerId = 'non-existent-id';
      const query: SellerInfoRequestDto = {};
      userService.findOne.mockResolvedValue(null as any);

      await expect(controller.getSellerInfo(sellerId, query, mockCurrentUser)).rejects.toThrow(NotFoundException);
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
          title: 'Live 1',
          thumbnailUrl: 'img1.jpg',
          scheduledAt: new Date(),
          products: [],
        }),
        new BroadcastListItemDto({
          id: 'b2',
          title: 'Live 2',
          thumbnailUrl: 'img2.jpg',
          scheduledAt: new Date(),
          products: [],
        }),
      ];

      const mockPagedResponse = new PagedResponseV2<BroadcastListItemDto>(
        mockItems,
        mockItems.length,
        query.page,
        query.limit,
        '방송 목록 조회 성공',
      );

      userService.findOne.mockResolvedValueOnce(mockSeller);
      broadcastService.findSellerBroadcastsPaged.mockResolvedValueOnce(mockPagedResponse);

      const result: PagedResponseV2<BroadcastListItemDto> = await controller.getSellerLives(sellerId, query);

      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(broadcastService.findSellerBroadcastsPaged).toHaveBeenCalledWith(sellerId, query);
      expect(result).toBeInstanceOf(PagedResponseV2);
      expect(result.success).toBe(true);
      expect((result.data as PagedResponseData<BroadcastListItemDto>).items).toEqual(mockItems);
      expect((result.data as PagedResponseData<BroadcastListItemDto>).total).toBe(mockItems.length);
      expect((result.data as PagedResponseData<BroadcastListItemDto>).page).toBe(query.page);
      expect((result.data as PagedResponseData<BroadcastListItemDto>).limit).toBe(query.limit);
      expect(result.timestamp).toEqual(expect.any(String));
    });

    it('should throw NotFoundException if seller does not exist', async () => {
      const sellerId = 'non-existent-seller';
      const query = { page: 1, limit: 10 };
      userService.findOne.mockRejectedValueOnce(new NotFoundException());

      await expect(controller.getSellerLives(sellerId, query)).rejects.toThrow(NotFoundException);
      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(broadcastService.findSellerBroadcastsPaged).not.toHaveBeenCalled();
    });
  });

  describe('getSellerProducts', () => {
    it('should return a list of seller products', async () => {
      const sellerId = 'test-seller-id';
      const query: SellerProductRequestDto = {};
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
        },
      ] as unknown as Product[];
      productService.findProductsBySeller.mockResolvedValue(mockProducts);

      // productService.getProductSalesCount를 mock 함수로 설정
      jest.spyOn(productService, 'getProductSalesCount').mockResolvedValue(0);

      // mock controller에서 반환되는 DTO 객체 생성
      const expectedItems = mockProducts.map((p) => {
        const dto = new SellerProductItemDto();
        dto.id = p.id;
        dto.name = p.name;
        dto.price = p.price;
        dto.thumbnailImage = p.mainImage;
        dto.description = p.shortDescription;
        dto.stock = p.stockQuantity;
        dto.salesCount = 0;
        return dto;
      });

      // SellerProductItemDto.fromEntity를 mock으로 설정
      jest.spyOn(SellerProductItemDto, 'fromEntity').mockImplementation(async (product) => {
        const dto = new SellerProductItemDto();
        dto.id = product.id;
        dto.name = product.name;
        dto.price = product.price;
        dto.thumbnailImage = product.mainImage;
        dto.description = product.shortDescription;
        dto.stock = product.stockQuantity;
        dto.salesCount = 0;
        return dto;
      });

      const result = await controller.getSellerProducts(sellerId, query);
      expect(productService.findProductsBySeller).toHaveBeenCalledWith(sellerId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('판매자 상품 목록입니다.');
      expect(result.data).toEqual(expectedItems);
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });
});

