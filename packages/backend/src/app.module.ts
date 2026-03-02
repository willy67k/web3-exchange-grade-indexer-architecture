import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { DemoModule } from "./modules/demo/demo.module.js";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

@Module({
  imports: [DemoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
