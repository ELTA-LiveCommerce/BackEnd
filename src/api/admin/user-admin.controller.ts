import { Body, Controller, Delete, Get, Param, Put, Query, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UpdateUserStatusDto } from '@/module/user/dto/update-user-status.dto';
import { UserSearchDto } from '@/module/user/dto/user-search.dto';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  /**
   * 회원 목록 조회 (검색, 필터링, 페이지네이션 기능 포함)
   */
  @Get()
  async findAll(@Query() searchDto: UserSearchDto) {
    return this.userService.searchForAdmin(searchDto);
  }

  /**
   * 회원 상세 정보 조회
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  /**
   * 회원 상태 변경 (정상/차단)
   */
  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() statusDto: UpdateUserStatusDto): Promise<User> {
    return this.userService.updateStatus(id, statusDto);
  }

  /**
   * 회원 삭제 (비활성화)
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.userService.deleteUser(id);
    return { success: result };
  }
}
