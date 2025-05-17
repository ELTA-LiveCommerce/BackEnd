import { IsString, IsNumber, IsIn } from 'class-validator';

export class RenewTokenDto {
  @IsString()
  broadcastId!: string;

  @IsString()
  uid!: string;

  @IsIn(['publisher', 'subscriber'])
  role!: 'publisher' | 'subscriber';
}

