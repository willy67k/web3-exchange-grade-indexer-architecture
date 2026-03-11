import { Module } from "@nestjs/common";
import { BlocksDomainService } from "./blocks/blocks.service.js";
import { TransfersDomainService } from "./transfers/transfers.service.js";
import { AccountsDomainService } from "./accounts/accounts.service.js";
import { LedgerModule } from "../ledger/ledger.module.js";

@Module({
  imports: [LedgerModule],
  providers: [BlocksDomainService, TransfersDomainService, AccountsDomainService],
  exports: [BlocksDomainService, TransfersDomainService, AccountsDomainService],
})
export class DomainModule {}
