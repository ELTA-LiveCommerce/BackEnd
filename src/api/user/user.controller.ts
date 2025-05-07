import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { CreateUserDto } from '@/module/user/dto/create-user.dto';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.userService.updateRole(id, role);
  }

  @Put(':id/bank-info')
  async updateBankInfo(
    @Param('id') id: string,
    @Body('accountNumber') accountNumber: string,
    @Body('bankName') bankName: string,
  ) {
    return this.userService.updateBankInfo(id, accountNumber, bankName);
  }

  @Put(':id/verify')
  async verifyUser(@Param('id') id: string) {
    return this.userService.verifyUser(id);
  }
}
