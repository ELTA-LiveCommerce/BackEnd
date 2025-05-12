import { Controller, Delete, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../module/auth/guards/jwt-auth.guard';
import { UserService } from '../../../module/user/user.service'; // Assuming UserService exists

@ApiTags('v2/user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v2/user')
export class UserController {
  constructor(private readonly userService: UserService) {} // Assuming UserService exists and is injectable

  @Delete('withdraw')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '회원 탈퇴',
    description: '현재 로그인된 사용자의 계정을 탈퇴 처리합니다.',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '회원 탈퇴 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 사용자' })
  async withdraw(@Req() req: any): Promise<void> {
    const userId = req.user.id; // Assuming user id is available in req.user.id after JwtAuthGuard
    await this.userService.withdrawUser(userId); // Assuming withdrawUser method exists in UserService
  }
}
