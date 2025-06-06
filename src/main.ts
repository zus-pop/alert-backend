import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transformOptions: {
        exposeUnsetFields: false,
      },
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('AI Alert Document')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();

  const documentationFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentationFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
