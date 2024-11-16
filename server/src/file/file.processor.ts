import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { FileService } from './file.service';
import { File } from './file.schema';
import { Model } from 'mongoose';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

@Processor('file-processing')
export class FileProcessor extends WorkerHost {
  private readonly logger = new Logger('FileProcessor');

  constructor(
    private readonly fileService: FileService,
    @InjectModel(File.name) private readonly fileModel: Model<File>,
  ) {
    super();
  }

  async process(job: any) {
    const { filePath, fileName } = job.data;

    try {
      const result = await this.fileService.processFile(filePath, fileName);
      this.logger.debug('File processed and saved:', result);
      fs.unlinkSync(filePath);
    } catch (error) {
      this.logger.error('Error processing file:', error);
      throw error;
    }
  }
}
