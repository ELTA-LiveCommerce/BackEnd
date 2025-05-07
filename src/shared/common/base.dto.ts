import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseResponseError {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;
}

@ApiExtraModels(BaseResponseError)
export class BaseResponse<T> {
  @ApiProperty()
  success!: boolean;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({ type: BaseResponseError })
  error?: BaseResponseError;

  constructor(success: boolean, data?: T, error?: BaseResponseError) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  static onSuccess<T>(data?: T): BaseResponse<T> {
    return new BaseResponse(true, data);
  }

  static onError(error: BaseResponseError): BaseResponse<undefined> {
    return new BaseResponse(false, undefined, error);
  }
}

export class BaseMessageResponse extends BaseResponse<{ message: string }> {
  constructor(success: boolean, message: string, error?: BaseResponseError) {
    super(success, { message }, error);
  }
}
