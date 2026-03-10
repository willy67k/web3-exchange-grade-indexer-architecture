import { Module } from "@nestjs/common";
import dotenv from "dotenv";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { DemoModule } from "./modules/demo/demo.module.js";
import { BlockchainModule } from "./modules/blockchain/blockchain.module.js";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

@Module({
  imports: [DemoModule, BlockchainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
