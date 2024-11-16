import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';

@Controller('file')
export class FileController {
  constructor(
    @InjectQueue('file-processing') private readonly fileQueue: Queue,
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    const responses = [];
    for (const file of files) {
      const uploadedFile = `${file.originalname.split('.')[0]}.heic`;
      const filePath = `uploads/${uploadedFile}`;
      await fs.promises.writeFile(filePath, file.buffer);
      await this.fileQueue.add('processFile', { filePath, uploadedFile });
      responses.push({
        message: `Receipt ${uploadedFile} added for processing!`,
      });
    }

    return responses;
  }
}
