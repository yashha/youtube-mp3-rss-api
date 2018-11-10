import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const port = 3000 || process.env.PORT;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port, () => {
    console.log(`Server started: http://localhost:${port}`)
  });
}
bootstrap();
