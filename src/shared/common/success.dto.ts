import { BaseMessageResponse, BaseResponse, BaseResponseError } from './base.dto';

export class SuccessEmptyResponse extends BaseResponse<undefined> {
  success!: boolean;
  error?: BaseResponseError;

  static onSuccess(): SuccessEmptyResponse {
    return new SuccessEmptyResponse(true);
  }
}

export class SuccessUuidResponse extends BaseResponse<{ uuid: string }> {}

export class SuccessUuidListResponse extends BaseResponse<{ uuids: string[] }> {}

export class SuccessMessageResponse extends BaseMessageResponse {}

export class SuccessCountResponse extends BaseResponse<number> {}
