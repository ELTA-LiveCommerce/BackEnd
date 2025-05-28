import { Module } from '@nestjs/common';

import { FileService } from './file.service';
import { AwsS3Service } from './aws-s3.service';

@Module({
  providers: [FileService, AwsS3Service],
  exports: [FileService, AwsS3Service],
})
export class FileModule {}

