import { S3Client } from '@aws-sdk/client-s3';
import { TextractClient } from '@aws-sdk/client-textract';
import { ConfigService } from '@nestjs/config';

export const createS3Client = (configService: ConfigService): S3Client => {
  return new S3Client({
    region: configService.get<string>('AWS_REGION'),
    credentials: {
      accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
    },
  });
};

export const createTextractClient = (
  configService: ConfigService,
): TextractClient => {
  return new TextractClient({
    region: configService.get<string>('AWS_REGION'),
    credentials: {
      accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
    },
  });
};
