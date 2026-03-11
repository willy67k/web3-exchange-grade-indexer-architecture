import { Module } from "@nestjs/common";
import { BlockPollerService } from "./block-poller/block-poller.service.js";
import { ReorgService } from "./block-processor/reorg.service.js";
import { QueueModule } from "./queue/queue.module.js";
import { ConfirmationStrategy } from "./block-poller/confirmation.strategy.js";
import { StatusSyncService } from "./block-poller/status-sync.service.js";

@Module({
  imports: [QueueModule],
  providers: [ConfirmationStrategy, ReorgService, BlockPollerService, StatusSyncService],
})
export class IndexerModule {}
