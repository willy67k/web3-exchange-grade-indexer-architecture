import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import dotenv from "dotenv";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { DemoModule } from "./modules/demo/demo.module.js";
import { BlockchainModule } from "./modules/blockchain/blockchain.module.js";
import { DatabaseModule } from "./modules/database/database.module.js";
import { QueueModule } from "./modules/indexer/queue/queue.module.js";
import { BlockPollerModule } from "./modules/indexer/block-poller/block-poller.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development",
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    DemoModule,
    BlockchainModule,
    QueueModule,
    BlockPollerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
