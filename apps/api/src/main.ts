import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { BigIntSerializerInterceptor } from './common/bigint-serializer.interceptor';

const compression = require('compression');

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTransitOnlyApi = process.env.TRANSIT_ONLY_API === 'true'
    || (isProduction && process.env.TRANSIT_ONLY_API !== 'false');
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true'
    || (!isProduction && process.env.ENABLE_SWAGGER !== 'false');
  const app = await NestFactory.create(AppModule);

  app.use(compression({ threshold: 1024 }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  if (isTransitOnlyApi) {
    const allowedMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (allowedMethods.has(req.method)) {
        next();
        return;
      }

      res.status(404).json({ statusCode: 404, message: 'Not Found' });
    });
  }

  app.useGlobalInterceptors(new BigIntSerializerInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Timișoara App API')
      .setDescription('Backend API for the Timișoara city super-app')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Timișoara API running on http://localhost:${port}`);
  if (isTransitOnlyApi) {
    console.log('Transit-only API mode enabled');
  }
  if (enableSwagger) {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
