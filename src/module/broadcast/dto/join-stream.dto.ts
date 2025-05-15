import {
  IsString,
} from 'class-validator';

export class JoinStreamDto {
  @IsString()
  channelId!: string;
}