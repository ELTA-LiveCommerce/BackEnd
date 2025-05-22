import { Test, TestingModule } from '@nestjs/testing';
import { SellerBlockController } from './block.controller';
import { UserBlockService } from '@/module/user/user-block.service';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { SellerBlockUserRequestDto } from './block-request.dto';
import {
  SellerBlockedUserListResponse,
  SellerBlockedUserResponse,
  SellerBlockedUserResponseBody,
} from './block-response.dto';
import { BlockType, SellerUserBlock } from '@/module/user/entity/seller-user-block.entity';
import { EmptyResponseV2 } from '@/api/v2/common/base-response.dto';
import { mock, MockProxy } from 'jest-mock-extended';
import { HttpStatus } from '@nestjs/common';

describe('SellerBlockController', () => {
  let controller: SellerBlockController;
  let userBlockService: MockProxy<UserBlockService>;

  const mockSeller = {
    id: 'seller-uuid',
    role: UserRole.SELLER,
  } as User;

  const mockBlockedUser = {
    id: 'viewer-uuid',
    role: UserRole.VIEWER,
  } as User;

  const mockBlockEntity = {
    id: 'block-uuid',
    seller: mockSeller,
    blockedUser: mockBlockedUser,
    blockType: BlockType.BLOCKED,
    reason: '테스트 차단 사유',
    createdAt: new Date(),
    updatedAt: new Date(),
    isBlocked: true,
    type: BlockType.BLOCKED,
  } as SellerUserBlock;

  const mockResponseBody = SellerBlockedUserResponseBody.fromEntity(mockBlockEntity);

  beforeEach(async () => {
    userBlockService = mock<UserBlockService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerBlockController],
      providers: [{ provide: UserBlockService, useValue: userBlockService }],
    }).compile();

    controller = module.get<SellerBlockController>(SellerBlockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('blockUser', () => {
    it('should block a user and return the block information', async () => {
      const blockDto: SellerBlockUserRequestDto = {
        userIdToBlock: mockBlockedUser.id,
        reason: '테스트 차단 사유',
        blockType: BlockType.BLOCKED,
      };
      userBlockService.blockUser.mockResolvedValue(mockBlockEntity);

      const result = await controller.blockUser(mockSeller, blockDto);

      expect(userBlockService.blockUser).toHaveBeenCalledWith(
        mockSeller.id,
        blockDto.userIdToBlock,
        blockDto.blockType,
        blockDto.reason,
      );
      expect(result.data).toEqual(mockResponseBody);
      expect(result.success).toBe(true);
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user and return no content status', async () => {
      userBlockService.unblockUser.mockResolvedValue(undefined);

      const result = await controller.unblockUser(mockSeller, mockBlockedUser.id);

      expect(userBlockService.unblockUser).toHaveBeenCalledWith(mockSeller.id, mockBlockedUser.id);
      // HttpCode(HttpStatus.NO_CONTENT) 데코레이터가 있어 반환값이 없거나 특정 응답이어야 함
      // EmptyResponseV2가 반환되므로 이를 확인
      expect(result).toBeInstanceOf(EmptyResponseV2);
      expect(result.message).toBe('사용자 차단을 해제했습니다.');
      expect(result.statusCode).toBe(200); // EmptyResponseV2 기본값 확인
    });
  });

  describe('getBlockedUsers', () => {
    it('should return a list of blocked users', async () => {
      const blockedUsersList = [mockBlockEntity];
      userBlockService.getBlockedUsersBySeller.mockResolvedValue(blockedUsersList);
      const expectedResponseBodies = blockedUsersList.map((block) => SellerBlockedUserResponseBody.fromEntity(block));

      const result = await controller.getBlockedUsers(mockSeller);

      expect(userBlockService.getBlockedUsersBySeller).toHaveBeenCalledWith(mockSeller.id);
      expect(result.data).toEqual(expectedResponseBodies);
      expect(result.success).toBe(true);
    });
  });
});

