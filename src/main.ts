import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { checkRedisHealth } from './config/redis.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule);

    // Configure global validation pipe
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

    // Enable CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type,Authorization',
    });

    // Health check for Redis
    const redisHealthy = await checkRedisHealth();
    if (!redisHealthy) {
      logger.warn('⚠️  Redis is not available, but application will continue');
    } else {
      logger.log('✅ Redis health check passed');
    }

    // Get port from environment
    const port = process.env.PORT || 3000;
    // 🔥 Swagger config
    const config = new DocumentBuilder()
      .setTitle('Payment API')
      .setDescription('UPI Payment Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth() // JWT support
      .build();

    const document = SwaggerModule.createDocument(app, config);
    if(process.env.NODE_ENV === 'development') {
      logger.log('📚 Setting up Swagger API documentation at /api');
      SwaggerModule.setup('api', app, document);
    }

    app.setGlobalPrefix('api'); // Set global prefix for all routes
    // Start application
    await app.listen(port);


    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
