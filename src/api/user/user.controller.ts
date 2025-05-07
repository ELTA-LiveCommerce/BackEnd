import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { CreateUserDto } from '@/module/user/dto/create-user.dto';
import { UpdateBankInfoDto } from '@/module/user/dto/update-profile.dto';
import { UserService } from '@/module/user/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 유저 정보를 조회합니다.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  /**
   * 회원가입 요청을 처리합니다.
   */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * 계좌 정보를 업데이트합니다.
   */
  @Put(':id/bank-info')
  async updateBankInfo(@Param('id') id: string, @Body() updateBankInfoDto: UpdateBankInfoDto) {
    return this.userService.updateBankInfo(id, updateBankInfoDto);
  }

  /**
   * 사용자 이메일을 인증 완료 상태로 변경합니다.
   */
  @Put(':id/verify')
  async verifyUser(@Param('id') id: string) {
    return this.userService.verifyUser(id);
  }
}
