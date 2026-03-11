import { Module } from "@nestjs/common";
import { BlockPollerService } from "./block-poller/block-poller.service.js";
import { ReorgService } from "./block-processor/reorg.service.js";
import { QueueModule } from "./queue/queue.module.js";
import { Erc20Listener } from "./listeners/erc20.listener.js";
import { BLOCK_LISTENERS } from "../../common/constants/blockListener.js";

@Module({
  imports: [QueueModule],
  providers: [
    Erc20Listener,
    ReorgService,
    BlockPollerService,
    {
      provide: BLOCK_LISTENERS,
      useFactory: (erc20: Erc20Listener) => [erc20],
      inject: [Erc20Listener],
    },
  ],
})
export class IndexerModule {}
