import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BLOCK_QUEUE } from "../../../constants/bullQueue.js";
import { BlockConsumer } from "./block.consumer.js";
import { IndexerModule } from "../indexer.module.js";

@Global()
@Module({
  imports: [
    IndexerModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "6379"),
      },
    }),
    BullModule.registerQueue({
      name: BLOCK_QUEUE,
    }),
  ],
  providers: [BlockConsumer],
  exports: [BullModule],
})
export class QueueModule {}
