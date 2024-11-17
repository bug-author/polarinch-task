import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT');
  const ALLOWED_ORIGIN = configService.get<string>('ALLOWED_ORIGIN');

  app.enableCors({ origin: ALLOWED_ORIGIN });

  await app.listen(PORT);
  logger.debug(`Server is running on ${PORT} port`);
}
bootstrap();
