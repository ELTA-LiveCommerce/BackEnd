import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { User } from '@/module/user/entity/user.entity';
import { UserBlockService } from '@/module/user/user-block.service';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { SellerBlockUserRequestDto } from './block-request.dto';
import {
  SellerBlockedUserListResponse,
  SellerBlockedUserResponse,
  SellerBlockedUserResponseBody,
} from './block-response.dto';
import { EmptyResponseV2 } from '@/api/v2/common/base-response.dto';
import { BlockType } from '@/module/user/entity/seller-user-block.entity';

@Controller('v2/sellers/blocks')
@UseGuards(JwtAuthGuard)
export class SellerBlockController {
  constructor(private readonly userBlockService: UserBlockService) {}

  @Post()
  async blockUser(
    @GetUser() seller: User,
    @Body() blockUserDto: SellerBlockUserRequestDto,
  ): Promise<SellerBlockedUserResponse> {
    const blockEntity = await this.userBlockService.blockUser(
      seller.id,
      blockUserDto.userIdToBlock,
      blockUserDto.blockType ?? BlockType.FULL_BLOCK,
      blockUserDto.reason,
    );
    const responseBody = SellerBlockedUserResponseBody.fromEntity(blockEntity);
    return SellerBlockedUserResponse.success(responseBody);
  }

  @Delete(':blockedUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockUser(@GetUser() seller: User, @Param('blockedUserId') blockedUserId: string): Promise<EmptyResponseV2> {
    await this.userBlockService.unblockUser(seller.id, blockedUserId);
    return new EmptyResponseV2('사용자 차단을 해제했습니다.');
  }

  @Get()
  async getBlockedUsers(@GetUser() seller: User): Promise<SellerBlockedUserListResponse> {
    const userBlockRelations = await this.userBlockService.getBlockedUsersBySeller(seller.id);
    const responseBodyArray = userBlockRelations.map((block) => SellerBlockedUserResponseBody.fromEntity(block));
    return SellerBlockedUserListResponse.success(responseBodyArray);
  }
}
