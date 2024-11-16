import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs';
import { join } from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  AnalyzeExpenseCommand,
  TextractClient,
} from '@aws-sdk/client-textract';
import { createS3Client, createTextractClient } from '../config/aws.config';

@Injectable()
export class FileService {
  private readonly s3: S3Client;
  private readonly textract: TextractClient;

  constructor(private configService: ConfigService) {
    this.s3 = createS3Client(this.configService);
    this.textract = createTextractClient(this.configService);
  }

  async convertHeicToJpg(filePath: string): Promise<string> {
    const outputFilePath = join('uploads', `${Date.now()}.jpg`);
    await sharp(filePath).toFormat('jpeg').toFile(outputFilePath);
    return outputFilePath;
  }

  async uploadToS3(filePath: string, s3Key: string) {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
      Bucket: this.configService.get<string>('AWS_BUCKET_NAME')!,
      Key: s3Key,
      Body: fileStream,
      ContentType: 'image/jpeg',
    };
    const command = new PutObjectCommand(uploadParams);
    return this.s3.send(command);
  }

  async analyzeDocument(s3Key: string) {
    const analyzeParams = {
      Document: {
        S3Object: {
          Bucket: this.configService.get<string>('AWS_BUCKET_NAME')!,
          Name: s3Key,
        },
      },
    };
    const command = new AnalyzeExpenseCommand(analyzeParams);
    return this.textract.send(command);
  }
}
