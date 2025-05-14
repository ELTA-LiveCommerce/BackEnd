import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class V2LoginRequestDto {
  @ApiProperty({ description: '사용자 아이디', example: 'testuser' })
  @IsString()
  @IsNotEmpty()
  loginId!: string;

  @ApiProperty({ description: '사용자 비밀번호', example: 'password123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class V2LoginResponseDto {
  @ApiProperty({ description: 'JWT 액세스 토큰' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT 리프레시 토큰', required: false })
  refreshToken?: string;

  @ApiProperty({ description: '사용자 ID', required: false })
  userId?: string;

  @ApiProperty({ description: '사용자 이름', required: false })
  name?: string;

  @ApiProperty({ description: '사용자 역할', required: false })
  role?: string;

  constructor(accessToken: string, refreshToken?: string, userId?: string, name?: string, role?: string) {
    this.accessToken = accessToken;
    if (refreshToken) this.refreshToken = refreshToken;
    if (userId) this.userId = userId;
    if (name) this.name = name;
    if (role) this.role = role;
  }
}
