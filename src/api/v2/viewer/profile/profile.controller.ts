import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { BaseResponseV2, EmptyResponseV2 } from '@/api/v2/common/base-response.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';

import {
  ProfileInfoResponseDto,
  ProfileInfoDto,
  UpdateProfileRequestDto,
  DeliveryAddressDto,
  CreateDeliveryAddressRequestDto,
  UpdateDeliveryAddressRequestDto,
  DeliveryAddressResponseDto,
  DeliveryAddressListResponseDto,
} from './profile.dto';
import { UpdateProfileDto } from '@/module/user/dto/update-profile.dto';

@Controller('v2/viewer/profile')
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  /**
   * 내 프로필 정보를 조회합니다.
   * 이름, 아이디, 전화번호, 계좌번호, 주소 정보를 조회할 수 있습니다.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyProfile(@GetUser() user: User): Promise<ProfileInfoResponseDto> {
    const userInfo = await this.userService.findOne(user.id);

    const profileInfo: ProfileInfoDto = {
      id: userInfo.id,
      name: userInfo.name,
      loginId: userInfo.loginId,
      phoneNumber: userInfo.phoneNumber || '',
      bankAccount: userInfo.accountNumber || '',
      bankName: userInfo.bankName || '',
      shippingAddress: userInfo.address || '',
    };

    return ProfileInfoResponseDto.success(profileInfo);
  }

  /**
   * 내 프로필 정보를 수정합니다.
   * 이름, 전화번호, 계좌번호, 주소 정보를 수정할 수 있습니다.
   */
  @UseGuards(JwtAuthGuard)
  @Put()
  async updateMyProfile(
    @GetUser() user: User,
    @Body() updateProfileDto: UpdateProfileRequestDto,
  ): Promise<BaseResponseV2<ProfileInfoDto>> {
    const profileUpdateData: UpdateProfileDto = {
      name: updateProfileDto.name,
      phoneNumber: updateProfileDto.phoneNumber,
      address: updateProfileDto.shippingAddress,
    };
    const updatedUser = await this.userService.updateProfile(user.id, profileUpdateData);

    if (updateProfileDto.bankName !== undefined || updateProfileDto.accountNumber !== undefined) {
      await this.userService.updateBankInfo(updatedUser.id, {
        bankName: updateProfileDto.bankName || '',
        accountNumber: updateProfileDto.accountNumber || '',
      });
    }

    const refreshedUserInfo = await this.userService.findOne(updatedUser.id);

    const profileInfo: ProfileInfoDto = {
      id: refreshedUserInfo.id,
      name: refreshedUserInfo.name,
      loginId: refreshedUserInfo.loginId,
      phoneNumber: refreshedUserInfo.phoneNumber || '',
      bankAccount: refreshedUserInfo.accountNumber || '',
      bankName: refreshedUserInfo.bankName || '',
      shippingAddress: refreshedUserInfo.address || '',
    };

    return BaseResponseV2.success(profileInfo, '프로필 정보가 업데이트되었습니다.');
  }

  // 아래의 배송지 목록/생성/수정/삭제 관련 엔드포인트들은 주석 처리 또는 삭제
  /*
  @UseGuards(JwtAuthGuard)
  @Get('delivery-addresses')
  async getDeliveryAddresses(@GetUser() user: User): Promise<DeliveryAddressListResponseDto> {
    // ... 기존 코드 ...
  }

  @UseGuards(JwtAuthGuard)
  @Post('delivery-addresses')
  async createDeliveryAddress(
    @GetUser() user: User,
    @Body() createDto: CreateDeliveryAddressRequestDto,
  ): Promise<DeliveryAddressResponseDto> {
    // ... 기존 코드 ...
  }

  @UseGuards(JwtAuthGuard)
  @Put('delivery-addresses/:addressId')
  async updateDeliveryAddress(
    @GetUser() user: User,
    @Param('addressId') addressId: string,
    @Body() updateDto: UpdateDeliveryAddressRequestDto,
  ): Promise<DeliveryAddressResponseDto> {
    // ... 기존 코드 ...
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delivery-addresses/:addressId')
  async deleteDeliveryAddress(@GetUser() user: User, @Param('addressId') addressId: string): Promise<EmptyResponseV2> {
    // ... 기존 코드 ...
  }
  */
}
