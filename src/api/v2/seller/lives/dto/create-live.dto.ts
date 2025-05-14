// ELTA 백엔드 프로젝트 개발 규칙 및 common-convention에 따라 작성합니다.
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLiveDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
