import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { UserService } from '@/module/user/user.service';
import { AdminUserListRequest, AdminUpdateUserRequest, AdminCreateUserRequest } from './dto/admin-user-request.dto';
import { AdminUserResponse, AdminUserListResponse } from './dto/admin-user-response.dto';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserListResponse })
  @Get()
  async getUsers(@Query() query: AdminUserListRequest): Promise<AdminUserListResponse> {
    const { users, total } = await this.userService.findAll({
      page: query.page,
      limit: query.limit,
      role: query.role,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return AdminUserListResponse.fromResult(users, total, query.page ?? 1, query.limit ?? 10);
  }

  @ApiOperation({ summary: '사용자 상세 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserResponse })
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<AdminUserResponse> {
    const user = await this.userService.findOne(id);
    return AdminUserResponse.fromEntity(user);
  }

  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminUserResponse })
  @Post()
  async createUser(@Body() dto: AdminCreateUserRequest): Promise<AdminUserResponse> {
    const createUserDto = {
      loginId: dto.email,
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: dto.role,
      phoneNumber: dto.phoneNumber,
    };

    const user = await this.userService.create(createUserDto);
    return AdminUserResponse.fromEntity(user);
  }

  @ApiOperation({ summary: '사용자 수정' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserResponse })
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserRequest): Promise<AdminUserResponse> {
    const user = await this.userService.update(id, dto);
    return AdminUserResponse.fromEntity(user);
  }

  @ApiOperation({ summary: '사용자 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}

