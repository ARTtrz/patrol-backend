import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('server');
  app.enableCors({
    origin: ['https://patrolai.vercel.app/'],
    methods: 'GET, POST',
    credentials: true,
  });
  await app.listen(8000);
}
bootstrap();
