import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '@/module/user/dto/create-user.dto';
import { ChangePasswordDto, UpdateBankInfoDto, UpdateProfileDto } from '@/module/user/dto/update-profile.dto';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new User();
    user.email = createUserDto.email;
    user.password = hashedPassword;
    user.name = createUserDto.name;
    user.role = createUserDto.role || UserRole.VIEWER;
    user.isVerified = false;

    if (createUserDto.phoneNumber) user.phoneNumber = createUserDto.phoneNumber;
    if (createUserDto.profileImage) user.profileImage = createUserDto.profileImage;
    if (createUserDto.accountNumber) user.accountNumber = createUserDto.accountNumber;
    if (createUserDto.bankName) user.bankName = createUserDto.bankName;

    await this.em.persistAndFlush(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ email });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    await this.em.persistAndFlush(user);
    return user;
  }

  async updateBankInfo(id: string, bankInfoDto: UpdateBankInfoDto): Promise<User> {
    const user = await this.findOne(id);
    user.accountNumber = bankInfoDto.accountNumber;
    user.bankName = bankInfoDto.bankName;
    await this.em.persistAndFlush(user);
    return user;
  }

  async verifyUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isVerified = true;
    await this.em.persistAndFlush(user);
    return user;
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateProfileDto.name) user.name = updateProfileDto.name;
    if (updateProfileDto.phoneNumber) user.phoneNumber = updateProfileDto.phoneNumber;
    if (updateProfileDto.profileImage) user.profileImage = updateProfileDto.profileImage;

    await this.em.persistAndFlush(user);
    return user;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<User> {
    const user = await this.findOne(id);

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
    }

    // 새 비밀번호 설정
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    await this.em.persistAndFlush(user);
    return user;
  }

  async uploadProfileImage(id: string, imageUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.profileImage = imageUrl;
    await this.em.persistAndFlush(user);
    return user;
  }
}
