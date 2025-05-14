import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { User } from '@/module/user/entity/user.entity';
import { BroadcastCreateRequestDto } from './dto/broadcast-create.request.dto';
import { BroadcastResponseDto } from './dto/broadcast.response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';

// RolesGuard와 JwtAuthGuard를 모킹합니다.
// 실제 테스트에서는 Guard의 canActivate가 true를 반환하도록 설정해야 합니다.
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

describe('BroadcastController', () => {
  let controller: BroadcastController;
  let service: BroadcastService;

  const mockBroadcastService = {
    createBroadcast: jest.fn(),
    findSellerBroadcastsPaged: jest.fn(), // 기존 메소드도 모킹
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BroadcastController],
      providers: [{ provide: BroadcastService, useValue: mockBroadcastService }],
    })
      // Guard를 오버라이드합니다.
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<BroadcastController>(BroadcastController);
    service = module.get<BroadcastService>(BroadcastService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBroadcast', () => {
    const mockUser = { id: 'seller-uuid', name: 'Test Seller' } as User;
    const createDto: BroadcastCreateRequestDto = {
      title: 'New Live',
      scheduledAt: new Date().toISOString(),
      productIds: ['prod-uuid-1'],
      thumbnailImageUrl: 'http://image.url/thumb.jpg',
    };
    const mockBroadcastListItem = new BroadcastListItemDto({
      id: 'broadcast-uuid',
      title: createDto.title,
      status: 'SCHEDULED',
      scheduledAt: new Date(createDto.scheduledAt),
      thumbnailUrl: createDto.thumbnailImageUrl,
      products: [{ id: 'prod-uuid-1', name: 'Product 1' }],
    });

    it('should call broadcastService.createBroadcast and return a BroadcastResponseDto', async () => {
      mockBroadcastService.createBroadcast.mockResolvedValue(mockBroadcastListItem);

      const result = await controller.createBroadcast(mockUser, createDto);

      expect(service.createBroadcast).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result).toBeInstanceOf(BroadcastResponseDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual(mockBroadcastListItem);
    });
  });
});
