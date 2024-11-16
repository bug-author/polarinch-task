import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import { promises as fs } from 'fs';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('File not provided');

    const filePath = join(__dirname, '../../uploads', `${uuid()}.heic`);

    try {
      // Save original file temporarily
      await fs.writeFile(filePath, file.buffer);

      // Convert and upload
      const convertedFilePath =
        await this.fileService.convertHeicToJpg(filePath);
      const s3Key = `converted-images/${uuid()}.jpg`;

      await this.fileService.uploadToS3(convertedFilePath, s3Key);
      const textractData = await this.fileService.analyzeDocument(s3Key);

      // Clean up files
      await fs.unlink(filePath);
      await fs.unlink(convertedFilePath);

      return {
        message: 'File uploaded and analyzed successfully!',
        data: textractData,
      };
    } catch (error) {
      console.error(error);
      throw new Error('File processing failed');
    }
  }
}
