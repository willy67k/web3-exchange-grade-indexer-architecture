import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigService } from "./config.service.js";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development",
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
