import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { UserService } from '@/module/user/user.service';
import { AdminFeeListRequest, AdminUpdateFeeRequest } from './dto/admin-fee-request.dto';
import { AdminFeeListResponse, AdminFeeResponse } from './dto/admin-fee-response.dto';

@ApiTags('admin-fees')
@Controller('admin/fees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFeeController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '셀러별 수수료 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminFeeListResponse })
  @Get()
  async getFees(@Query() query: AdminFeeListRequest): Promise<AdminFeeListResponse> {
    // 셀러 역할을 가진 사용자만 조회
    const { page = 1, limit = 10, search, sortBy, sortOrder } = query;

    const result = await this.userService.findAll({
      page,
      limit,
      role: UserRole.SELLER,
      search,
      sortBy,
      sortOrder,
    });

    return AdminFeeListResponse.fromUsers(result.users, result.total, page, limit);
  }

  @ApiOperation({ summary: '셀러별 수수료 정보 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminFeeResponse })
  @Get(':id')
  async getFee(@Param('id') id: string): Promise<{ data: AdminFeeResponse }> {
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException(`셀러 ID ${id}를 찾을 수 없습니다.`);
    }

    if (user.role !== UserRole.SELLER) {
      throw new BadRequestException(`해당 사용자는 셀러가 아닙니다.`);
    }

    const response = AdminFeeResponse.fromEntity(user);
    return { data: response };
  }

  @ApiOperation({ summary: '셀러 수수료 수정' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminFeeResponse })
  @Put(':id')
  async updateFee(
    @Param('id') id: string,
    @Body() updateFeeDto: AdminUpdateFeeRequest,
  ): Promise<{ data: AdminFeeResponse }> {
    // 셀러 존재 여부 확인
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException(`셀러 ID ${id}를 찾을 수 없습니다.`);
    }

    if (user.role !== UserRole.SELLER) {
      throw new BadRequestException(`해당 사용자는 셀러가 아닙니다.`);
    }

    // 수수료 업데이트
    const updatedUser = await this.userService.update(id, {
      feePercentage: updateFeeDto.feePercentage,
    });

    const response = AdminFeeResponse.fromEntity(updatedUser);
    return { data: response };
  }
}

