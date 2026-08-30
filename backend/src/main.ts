import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { AppModule } from './app.module';

mongoose.set('updatePipeline', true);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(compression());

  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:5173,http://localhost:8081')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', 'true').toLowerCase() ===
    'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PFE Queue Management API')
      .setDescription(
        'Enterprise-grade API for Appointment and Queue Management with QR Code',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  if (swaggerEnabled) {
    logger.log(
      `📚 Swagger Documentation is running on: http://localhost:${port}/api/docs`,
    );
  }
}

void bootstrap();
