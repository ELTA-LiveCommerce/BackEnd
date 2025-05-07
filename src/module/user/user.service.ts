import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '@/module/user/dto/create-user.dto';
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

  async updateBankInfo(id: string, accountNumber: string, bankName: string): Promise<User> {
    const user = await this.findOne(id);
    user.accountNumber = accountNumber;
    user.bankName = bankName;
    await this.em.persistAndFlush(user);
    return user;
  }

  async verifyUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isVerified = true;
    await this.em.persistAndFlush(user);
    return user;
  }
}
