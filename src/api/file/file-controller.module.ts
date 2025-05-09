import { Module } from '@nestjs/common';

import { FileModule } from '@/module/file/file.module';

import { FileController } from './file.controller';

@Module({
  imports: [FileModule],
  controllers: [FileController],
})
export class FileControllerModule {}
