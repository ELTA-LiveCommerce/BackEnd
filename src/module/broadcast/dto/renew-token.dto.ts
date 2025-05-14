import {
  IsString,
  IsNumber,
  IsIn,
} from 'class-validator';

export class RenewTokenDto {
  @IsString()
  channelId!: string;

  @IsNumber()
  uid!: number;

  @IsIn(['publisher', 'subscriber'])
  role!: 'publisher' | 'subscriber';
}
