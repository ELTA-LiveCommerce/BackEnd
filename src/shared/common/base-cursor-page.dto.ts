import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponse } from './base.dto';

@ApiExtraModels()
export class CursorPage<T> {
  @ApiProperty()
  list: T[];

  @ApiPropertyOptional()
  nextPageCursor?: string;

  constructor(data: T[], nextPageCursor?: string | null) {
    this.list = data;
    this.nextPageCursor = nextPageCursor || undefined;
  }
}

export class BaseCursorPageResponse<T> extends BaseResponse<CursorPage<T>> {
  @ApiPropertyOptional({ type: () => CursorPage })
  data?: CursorPage<T>;

  constructor(data: CursorPage<T>) {
    super(true, data);
  }
}
