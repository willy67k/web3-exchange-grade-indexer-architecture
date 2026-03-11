import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppConfigModule } from "./config/config.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { DemoModule } from "./modules/demo/demo.module.js";
import { BlockchainModule } from "./modules/blockchain/blockchain.module.js";
import { DatabaseModule } from "./modules/database/database.module.js";
import { IndexerModule } from "./modules/indexer/indexer.module.js";
import { LedgerModule } from "./modules/ledger/ledger.module.js";
import { DomainModule } from "./modules/domain/domain.module.js";

@Module({
  imports: [AppConfigModule, ScheduleModule.forRoot(), DatabaseModule, DemoModule, BlockchainModule, IndexerModule, LedgerModule, DomainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
