import { Module } from '@nestjs/common';

import { AnnouncementController } from './announcement.controller';
import { AnnouncementModule } from '@/module/announcement/announcement.module';

@Module({
  imports: [AnnouncementModule],
  controllers: [AnnouncementController],
})
export class AnnouncementControllerModule {}
