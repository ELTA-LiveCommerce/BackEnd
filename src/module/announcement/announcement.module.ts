import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { Announcement } from './entity/announcement.entity';
import { AnnouncementService } from './announcement.service';

@Module({
  imports: [MikroOrmModule.forFeature([Announcement])],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
