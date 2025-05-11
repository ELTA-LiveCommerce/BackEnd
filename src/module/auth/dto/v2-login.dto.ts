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

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
