import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

import { UserRole } from '@/shared/enum/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: '비밀번호는 최소 8자 이상, 20자 이하이며, 영문 대/소문자, 숫자, 특수문자를 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @Length(2, 50)
  name: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: '유효한 사용자 역할이 아닙니다.' })
  role?: UserRole;
}
