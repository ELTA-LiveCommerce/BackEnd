import { BaseMessageResponse, BaseResponse, BaseResponseError } from './base.dto';

export class SuccessEmptyResponse extends BaseResponse<undefined> {
  success = true;
  error?: BaseResponseError = undefined;

  constructor() {
    super(true);
  }

  static onSuccess(): SuccessEmptyResponse {
    return new SuccessEmptyResponse();
  }
}

export class SuccessUuidResponse extends BaseResponse<{ uuid: string }> {}

export class SuccessUuidListResponse extends BaseResponse<{ uuids: string[] }> {}

export class SuccessMessageResponse extends BaseMessageResponse {}

export class SuccessCountResponse extends BaseResponse<number> {}
