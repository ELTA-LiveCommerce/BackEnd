import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AnnouncementService } from '@/module/announcement/announcement.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementResponseDto,
  GetAnnouncementsQueryDto,
} from '@/module/announcement/dto/announcement.dto';
import { UserDecorator as User } from '@/shared/common/decorators/user.decorator';
import { User as UserEntity } from '@/module/user/entity/user.entity';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@ApiTags('v2/announcements')
@Controller('v2/announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 공지사항 생성 (관리자)' })
  @ApiResponse({ status: 201, description: '공지사항 생성 성공', type: AnnouncementResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @User() currentUser: UserEntity,
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementService.create(createAnnouncementDto, currentUser);
    return AnnouncementResponseDto.fromEntity(announcement);
  }

  @Get()
  @ApiOperation({ summary: '공지사항 목록 조회' })
  @ApiResponse({ status: 200, description: '공지사항 목록 조회 성공', type: [AnnouncementResponseDto] })
  async findAll(
    @Query() query: GetAnnouncementsQueryDto,
  ): Promise<{ announcements: AnnouncementResponseDto[]; total: number }> {
    const { announcements, total } = await this.announcementService.findAll(query);
    return {
      announcements: announcements.map((ann) => AnnouncementResponseDto.fromEntity(ann)),
      total,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 공지사항 조회' })
  @ApiResponse({ status: 200, description: '공지사항 조회 성공', type: AnnouncementResponseDto })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  async findOne(@Param('id') id: string): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementService.findOne(id);
    return AnnouncementResponseDto.fromEntity(announcement);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 공지사항 수정 (관리자)' })
  @ApiResponse({ status: 200, description: '공지사항 수정 성공', type: AnnouncementResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  async update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    @User() currentUser: UserEntity,
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementService.update(id, updateAnnouncementDto, currentUser);
    return AnnouncementResponseDto.fromEntity(announcement);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 공지사항 삭제 (관리자)' })
  @ApiResponse({ status: 200, description: '공지사항 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  async remove(@Param('id') id: string, @User() currentUser: UserEntity): Promise<void> {
    await this.announcementService.remove(id, currentUser);
  }
}
