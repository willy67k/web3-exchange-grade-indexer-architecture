import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const config = new DocumentBuilder().setTitle("Blockchain API").setDescription("Ethers").setVersion("1.0").build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger/api", app, document);

  if (process.env.VERCEL || process.env.VITE_VERCEL_ENV) {
    await app.init();
    return app.getHttpAdapter().getInstance();
  }

  await app.listen(process.env.PORT ?? 6970);
}

let handler;
if (process.env.VERCEL || process.env.VITE_VERCEL_ENV) {
  handler = async (req: any, res: any) => {
    const server = await bootstrap();
    return server(req, res);
  };
} else {
  bootstrap();
}

export default handler;
