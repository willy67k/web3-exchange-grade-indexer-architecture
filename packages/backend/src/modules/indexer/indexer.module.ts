import { Module } from "@nestjs/common";
import { BlockPollerService } from "./block-poller/block-poller.service.js";
import { ReorgService } from "./block-processor/reorg.service.js";
import { QueueModule } from "./queue/queue.module.js";
import { Erc20Listener } from "./listeners/erc20.listener.js";
import { BLOCK_LISTENERS } from "../../common/constants/blockListener.js";
import { ConfirmationStrategy } from "./block-poller/confirmation.strategy.js";

@Module({
  imports: [QueueModule],
  providers: [
    ConfirmationStrategy,
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
