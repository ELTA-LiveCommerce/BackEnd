import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class V2RefreshTokenRequestDto {
  @ApiProperty({ description: '리프레시 토큰', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class V2RefreshTokenResponseDto {
  @ApiProperty({ description: '새로운 JWT 액세스 토큰' })
  accessToken!: string;

  @ApiProperty({ description: '액세스 토큰 만료 시간(초)', example: 900 })
  expiresIn!: number;

  @ApiProperty({ description: '토큰 타입', example: 'bearer' })
  tokenType!: string;

  constructor(data: { accessToken: string; expiresIn: number; tokenType: string }) {
    this.accessToken = data.accessToken;
    this.expiresIn = data.expiresIn;
    this.tokenType = data.tokenType;
  }
}
