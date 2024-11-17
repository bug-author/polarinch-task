import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema } from './file.schema';
import { FileProcessor } from './file.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    BullModule.registerQueue({
      name: 'file-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  controllers: [FileController],
  providers: [FileService, FileProcessor],
  exports: [FileService],
})
export class FileModule {}
