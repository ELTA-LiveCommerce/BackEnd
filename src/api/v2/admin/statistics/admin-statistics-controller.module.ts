import { Module } from '@nestjs/common';
import { StatisticsModule } from '@/module/statistics/statistics.module';
import { AdminStatisticsController } from './admin-statistics.controller';

@Module({
  imports: [StatisticsModule],
  controllers: [AdminStatisticsController],
})
export class AdminStatisticsControllerModule {}
