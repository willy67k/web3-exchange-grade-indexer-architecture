import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppConfigService } from "./config/config.service.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: configService.frontendUrl,
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

  await app.listen(configService.port);
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
