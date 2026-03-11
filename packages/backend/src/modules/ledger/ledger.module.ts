import { Module } from "@nestjs/common";
import { LedgerController } from "./ledger.controller.js";
import { LedgerService } from "./ledger.service.js";
import { LedgerRepository } from "./ledger.repository.js";
import { ConfirmationStrategy } from "../indexer/block-poller/confirmation.strategy.js";

@Module({
  controllers: [LedgerController],
  providers: [LedgerService, LedgerRepository, ConfirmationStrategy],
  exports: [LedgerService], // 導出 Service 供其他模組（如 Domain）使用
})
export class LedgerModule {}
