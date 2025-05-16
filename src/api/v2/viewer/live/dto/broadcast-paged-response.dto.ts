import { ApiProperty } from '@nestjs/swagger';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';

export class BroadcastPagedResponseDto extends PagedResponseV2<BroadcastListItemDto> {
  @ApiProperty({ type: [BroadcastListItemDto] })
  items: BroadcastListItemDto[];
}
