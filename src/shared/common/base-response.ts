import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

export class OffsetPage<T> {
  items: T[];
  total: number;
  pageSize: number;
  pageNum: number;

  constructor(items: T[], total: number, pageSize: number, pageNum: number) {
    this.items = items;
    this.total = total;
    this.pageSize = pageSize;
    this.pageNum = pageNum;
  }
}

export class BaseOffsetPageResponse<T> extends BaseResponseV2<OffsetPage<T>> {
  constructor(data: OffsetPage<T>, message = 'OK', statusCode = 200) {
    super(true, statusCode, message, data);
  }
}

