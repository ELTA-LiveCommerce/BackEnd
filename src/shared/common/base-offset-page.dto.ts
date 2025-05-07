import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponse } from './base.dto';

@ApiExtraModels()
export class OffsetPage<T> {
  @ApiProperty()
  list: T[];

  @ApiProperty()
  count: number;

  constructor(data: T[], count: number) {
    this.list = data;
    this.count = count;
  }
}

export class BaseOffsetPageResponse<T> extends BaseResponse<OffsetPage<T>> {
  @ApiPropertyOptional({ type: () => OffsetPage })
  data?: OffsetPage<T>;

  constructor(data: OffsetPage<T>) {
    super(true, data);
  }
}
