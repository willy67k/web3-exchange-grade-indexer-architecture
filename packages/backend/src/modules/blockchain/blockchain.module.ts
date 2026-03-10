import { Module, Global } from "@nestjs/common";
import { BlockchainService } from "./blockchain.service.js";
import { ChainRegistry } from "./chain.registry.js";

@Global()
@Module({
  providers: [BlockchainService, ChainRegistry],
  exports: [BlockchainService, ChainRegistry],
})
export class BlockchainModule {}
