import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { UserService } from '@/module/user/user.service';
import { User } from '@/module/user/entity/user.entity';
// import { UpdateUserStatusDto } from '@/module/user/dto/update-user-status.dto';
import { GetUsersDto } from '@/module/user/dto/get-users.dto';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('v1/admin/users')
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '모든 사용자 목록 조회 (관리자)' })
  async findAll(@Query() getUsersDto: GetUsersDto): Promise<{ users: User[]; total: number }> {
    return this.userService.findAllAdmin(getUsersDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 사용자 정보 조회 (관리자)' })
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.userService.findOneAdmin(id);
  }

  // @Patch(':id/status')
  // @ApiOperation({ summary: '사용자 상태 변경 (관리자)' })
  // async updateStatus(
  //   @Param('id') id: string,
  //   @Body() statusDto: UpdateUserStatusDto,
  // ): Promise<User> {
  //   return this.userService.updateStatus(id, statusDto);
  // }

  // TODO: Add endpoints for deleting users, updating roles, etc. (Admin only)
}
