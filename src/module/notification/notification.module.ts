import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { INotificationService } from './interface/notification.service.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: INotificationService,
      useClass: NotificationService,
    },
  ],
  exports: [INotificationService],
})
export class NotificationModule {}

