import { Module } from "@nestjs/common";
import { BlockPollerService } from "./block-poller.service.js";
import { ProcessorsModule } from "../processor/processors.module.js";

@Module({
  imports: [ProcessorsModule],
  providers: [BlockPollerService],
  exports: [BlockPollerService],
})
export class BlockPollerModule {}
