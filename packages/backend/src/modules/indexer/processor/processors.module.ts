import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BlockProcessor } from "./block.processor.js";
import { BLOCK_QUEUE } from "../../../constants/bullqueue.js";

@Module({
  imports: [
    BullModule.registerQueue({
      name: BLOCK_QUEUE,
    }),
  ],
  providers: [BlockProcessor],
  exports: [BullModule],
})
export class ProcessorsModule {}
