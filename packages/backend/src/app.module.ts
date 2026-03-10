import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import dotenv from "dotenv";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { DemoModule } from "./modules/demo/demo.module.js";
import { BlockchainModule } from "./modules/blockchain/blockchain.module.js";
import { DatabaseModule } from "./modules/database/database.module.js";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFile,
    }),
    DatabaseModule,
    DemoModule,
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
