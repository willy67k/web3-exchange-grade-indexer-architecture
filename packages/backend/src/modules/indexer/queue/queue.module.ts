import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BLOCK_QUEUE } from "../../../common/constants/bullQueue.js";
import { AppConfigService } from "../../../config/config.service.js";
import { BlockConsumer } from "./block.consumer.js";
import { ReorgService } from "../block-processor/reorg.service.js";
import { Erc20Listener } from "../listeners/erc20.listener.js";
import { BLOCK_LISTENERS } from "../../../common/constants/blockListener.js";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        connection: {
          host: configService.redisHost,
          port: configService.redisPort,
        },
      }),
    }),
    BullModule.registerQueue({
      name: BLOCK_QUEUE,
    }),
  ],
  providers: [
    ReorgService,
    BlockConsumer,
    Erc20Listener,
    {
      provide: BLOCK_LISTENERS,
      useFactory: (erc20: Erc20Listener) => [erc20],
      inject: [Erc20Listener],
    },
  ],
  exports: [BullModule],
})
export class QueueModule {}
