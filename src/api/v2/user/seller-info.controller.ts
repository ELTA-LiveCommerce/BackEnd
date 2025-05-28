import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import { CurrentUser } from '@/shared/common/decorators/current-user.decorator';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';
import { SellerInfoResponse, SellerInfoResponseBody } from './dto/seller-info-response.dto';

@ApiTags('v2/user/seller-info')
@Controller('v2/user/seller-info')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerInfoController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: '셀러 정보 조회',
    description: '현재 로그인한 셀러의 상호명, 사업자주소, 사업자번호를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '셀러 정보 조회 성공', type: SellerInfoResponse })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (셀러만 접근 가능)' })
  @ApiResponse({ status: 404, description: '셀러 정보를 찾을 수 없음' })
  async getSellerInfo(@CurrentUser() currentUser: { userId: string }): Promise<SellerInfoResponse> {
    const sellerInfo = await this.userService.getSellerInfo(currentUser.userId);
    const responseData = SellerInfoResponseBody.fromResult(sellerInfo);

    return {
      success: true,
      data: responseData,
    };
  }
}

