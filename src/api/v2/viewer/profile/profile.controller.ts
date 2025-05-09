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

@Controller('v2/viewer/profile')
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  /**
   * 내 프로필 정보를 조회합니다.
   * 이름, 아이디, 전화번호, 계좌번호, 배송지 정보를 조회할 수 있습니다.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyProfile(@GetUser() user: User): Promise<ProfileInfoResponseDto> {
    // 사용자 정보 조회
    const userInfo = await this.userService.findOne(user.id);

    // 배송지 정보 조회 (실제 구현 필요)
    const deliveryAddresses: DeliveryAddressDto[] = []; // 실제 배송지 정보 조회 필요

    // 응답 데이터 변환
    const profileInfo: ProfileInfoDto = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      phoneNumber: userInfo.phoneNumber || '',
      bankAccount: userInfo.accountNumber || '',
      bankName: userInfo.bankName || '',
      deliveryAddresses,
    };

    return ProfileInfoResponseDto.success(profileInfo);
  }

  /**
   * 내 프로필 정보를 수정합니다.
   * 이름, 전화번호, 계좌번호 정보를 수정할 수 있습니다.
   */
  @UseGuards(JwtAuthGuard)
  @Put()
  async updateMyProfile(
    @GetUser() user: User,
    @Body() updateProfileDto: UpdateProfileRequestDto,
  ): Promise<BaseResponseV2<User>> {
    // 프로필 정보 업데이트
    const updatedProfileUser = await this.userService.updateProfile(user.id, {
      name: updateProfileDto.name,
      phoneNumber: updateProfileDto.phoneNumber,
    });

    // 계좌 정보 업데이트 (undefined 값은 전달하지 않음)
    const bankUpdateData: { bankName?: string; accountNumber?: string } = {};
    if (updateProfileDto.bankName) {
      bankUpdateData.bankName = updateProfileDto.bankName;
    }
    if (updateProfileDto.accountNumber) {
      bankUpdateData.accountNumber = updateProfileDto.accountNumber;
    }

    // 은행 정보가 업데이트된 경우에만 호출
    let updatedUser = updatedProfileUser;
    if (Object.keys(bankUpdateData).length > 0) {
      updatedUser = await this.userService.updateBankInfo(user.id, bankUpdateData);
    }

    return BaseResponseV2.success(updatedUser, '프로필 정보가 업데이트되었습니다.');
  }

  /**
   * 배송지 목록을 조회합니다.
   */
  @UseGuards(JwtAuthGuard)
  @Get('delivery-addresses')
  async getDeliveryAddresses(@GetUser() user: User): Promise<DeliveryAddressListResponseDto> {
    // 배송지 정보 조회 (실제 구현 필요)
    const deliveryAddresses: DeliveryAddressDto[] = []; // 실제 배송지 정보 조회 필요

    return DeliveryAddressListResponseDto.success(deliveryAddresses);
  }

  /**
   * 새로운 배송지를 추가합니다.
   */
  @UseGuards(JwtAuthGuard)
  @Post('delivery-addresses')
  async createDeliveryAddress(
    @GetUser() user: User,
    @Body() createDto: CreateDeliveryAddressRequestDto,
  ): Promise<DeliveryAddressResponseDto> {
    // 배송지 생성 (실제 구현 필요)
    const newAddress: DeliveryAddressDto = {
      id: 'new-address-id', // 실제 생성된 ID
      address: createDto.address,
      detailAddress: createDto.detailAddress,
      postalCode: createDto.postalCode,
      receiverName: createDto.receiverName,
      receiverPhone: createDto.receiverPhone,
      isDefault: createDto.isDefault || false,
    };

    return DeliveryAddressResponseDto.success(newAddress);
  }

  /**
   * 배송지 정보를 수정합니다.
   */
  @UseGuards(JwtAuthGuard)
  @Put('delivery-addresses/:addressId')
  async updateDeliveryAddress(
    @GetUser() user: User,
    @Param('addressId') addressId: string,
    @Body() updateDto: UpdateDeliveryAddressRequestDto,
  ): Promise<DeliveryAddressResponseDto> {
    // 배송지 업데이트 (실제 구현 필요)
    const updatedAddress: DeliveryAddressDto = {
      id: addressId,
      address: updateDto.address,
      detailAddress: updateDto.detailAddress,
      postalCode: updateDto.postalCode,
      receiverName: updateDto.receiverName,
      receiverPhone: updateDto.receiverPhone,
      isDefault: updateDto.isDefault || false,
    };

    return DeliveryAddressResponseDto.success(updatedAddress);
  }

  /**
   * 배송지를 삭제합니다.
   */
  @UseGuards(JwtAuthGuard)
  @Delete('delivery-addresses/:addressId')
  async deleteDeliveryAddress(@GetUser() user: User, @Param('addressId') addressId: string): Promise<EmptyResponseV2> {
    // 배송지 삭제 (실제 구현 필요)
    // await this.deliveryAddressService.delete(addressId);

    return new EmptyResponseV2('배송지가 삭제되었습니다.');
  }
}
