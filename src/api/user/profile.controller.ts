import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { imageFileFilter, storageConfig } from '@/infra/config/storage.config';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { ChangePasswordDto, UpdateBankInfoDto, UpdateProfileDto } from '@/module/user/dto/update-profile.dto';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';

/**
 * 사용자 프로필 관리 컨트롤러
 */
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  /**
   * 자신의 프로필 정보 조회
   */
  @Get()
  async getMyProfile(@Req() req: Request): Promise<User> {
    const user = req.user as User;
    return this.userService.findOne(user.id);
  }

  /**
   * 프로필 기본 정보 업데이트
   */
  @Put()
  async updateProfile(@Req() req: Request, @Body() updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = req.user as User;
    return this.userService.updateProfile(user.id, updateProfileDto);
  }

  /**
   * 계좌 정보 업데이트
   */
  @Put('bank-info')
  async updateBankInfo(@Req() req: Request, @Body() updateBankInfoDto: UpdateBankInfoDto): Promise<User> {
    const user = req.user as User;
    return this.userService.updateBankInfo(user.id, updateBankInfoDto);
  }

  /**
   * 비밀번호 변경
   */
  @Put('password')
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    const user = req.user as User;
    await this.userService.changePassword(user.id, changePasswordDto);
    return { success: true };
  }

  /**
   * 프로필 이미지 업로드
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: storageConfig.profileImage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }

    const user = req.user as User;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const imageUrl = `${serverUrl}/uploads/profiles/${file.filename}`;

    await this.userService.uploadProfileImage(user.id, imageUrl);
    return { imageUrl };
  }
}
