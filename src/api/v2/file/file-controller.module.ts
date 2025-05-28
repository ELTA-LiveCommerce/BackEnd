import { Module } from '@nestjs/common';

import { FileController } from './file.controller';
import { FileModule } from '@/module/file/file.module';

@Module({
  imports: [FileModule],
  controllers: [FileController],
})
export class FileControllerModule {}

