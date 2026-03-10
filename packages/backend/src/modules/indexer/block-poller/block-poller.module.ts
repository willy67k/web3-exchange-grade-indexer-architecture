import { Module } from "@nestjs/common";
import { BlockPollerService } from "./block-poller.service.js";

@Module({
  providers: [BlockPollerService],
  exports: [BlockPollerService],
})
export class BlockPollerModule {}
