import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BaseEntity } from '@/shared/entity/base.entity';
import { AnnouncementTargetPlatform } from '@/shared/enum/announcement-target-platform.enum';

@Entity({ tableName: 'announcements' })
export class Announcement extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'text', nullable: true })
  content?: string; // HTML 내용도 저장 가능하도록 text 타입

  @Property({ type: 'string', length: 2048 })
  imageUrl!: string; // 이미지 URL

  @Property({ type: 'Date' })
  startDate!: Date; // 게시 시작일

  @Property({ type: 'Date' })
  endDate!: Date; // 게시 종료일

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true; // 활성 여부

  @Property({ type: 'number', default: 0 })
  displayOrder: number = 0; // 표시 순서 (낮을수록 먼저)

  @Enum({ items: () => AnnouncementTargetPlatform, type: 'string', default: AnnouncementTargetPlatform.ALL })
  targetPlatform: AnnouncementTargetPlatform = AnnouncementTargetPlatform.ALL;

  @Property({ type: 'string', length: 2048, nullable: true })
  linkUrl?: string; // 클릭 시 이동할 URL

  constructor(data?: Partial<Announcement>) {
    super();
    if (data) {
      Object.assign(this, data);
    }
  }
}
