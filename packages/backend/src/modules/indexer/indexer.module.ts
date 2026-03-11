import { Module } from "@nestjs/common";
import { BlockPollerService } from "./block-poller/block-poller.service.js";
import { ReorgService } from "./block-processor/reorg.service.js";

@Module({
  providers: [BlockPollerService, ReorgService],
  exports: [BlockPollerService, ReorgService],
})
export class IndexerModule {}
