import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class V2AppLoginRequestDto {
  @ApiProperty({ description: '사용자 아이디', example: 'testuser' })
  @IsString()
  @IsNotEmpty()
  loginId!: string;

  @ApiProperty({ description: '사용자 비밀번호', example: 'password123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ description: '기기 식별자', example: 'device123', required: false })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ description: '앱 버전', example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  appVersion?: string;
}

export class V2AppLoginResponseDto {
  @ApiProperty({ description: 'JWT 액세스 토큰' })
  accessToken!: string;

  @ApiProperty({ description: '리프레시 토큰' })
  refreshToken!: string;

  @ApiProperty({ description: '사용자 ID' })
  userId!: string;

  @ApiProperty({ description: '사용자 이름' })
  name!: string;

  @ApiProperty({ description: '사용자 역할' })
  role!: string;

  constructor(data: { accessToken: string; refreshToken: string; userId: string; name: string; role: string }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.userId = data.userId;
    this.name = data.name;
    this.role = data.role;
  }
}
