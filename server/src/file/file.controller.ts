import {
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  constructor(
    @InjectQueue('file-processing') private readonly fileQueue: Queue,
    private readonly fileService: FileService,
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    const responses = [];
    for (const file of files) {
      const uploadedFile = `${file.originalname.split('.')[0]}.heic`;
      const filePath = `uploads/${uploadedFile}`;
      console.log(filePath, uploadedFile);
      await fs.promises.writeFile(filePath, file.buffer);
      await this.fileQueue.add('processFile', {
        filePath,
        fileName: uploadedFile,
      });
      responses.push({
        message: `Receipt ${uploadedFile} added for processing!`,
      });
    }

    return responses;
  }

  @Get('insights')
  async getInsights() {
    return await this.fileService.getInsights();
  }

  @Get('collective-insights')
  async getCollectiveInsights() {
    return await this.fileService.getCollectiveInsights();
  }
}
