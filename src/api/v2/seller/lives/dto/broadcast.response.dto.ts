import { ApiProperty } from '@nestjs/swagger';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

export class BroadcastResponseDto extends BaseResponseV2<BroadcastListItemDto> {
  @ApiProperty({ type: BroadcastListItemDto })
  declare data: BroadcastListItemDto;

  constructor(data: BroadcastListItemDto) {
    super(true, 201, 'Successfully created broadcast.', data);
  }
}
