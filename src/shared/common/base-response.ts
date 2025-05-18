export class BaseResponse<T> {
  success: boolean;
  data: T;

  constructor(data: T) {
    this.success = true;
    this.data = data;
  }
}

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

export class BaseOffsetPageResponse<T> extends BaseResponse<OffsetPage<T>> {
  constructor(data: OffsetPage<T>) {
    super(data);
  }
}

