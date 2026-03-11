import { Controller, Get, Query, Param, ParseIntPipe } from "@nestjs/common";
import { LedgerService } from "./ledger.service.js";

@Controller("ledger")
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  // 查詢餘額: GET /ledger/balance/11155111?account=0x...&token=0x...
  @Get("balance/:chainId")
  async getBalance(@Param("chainId", ParseIntPipe) chainId: number, @Query("account") account: string, @Query("token") tokenAddress: string) {
    return await this.ledgerService.getAccountBalance(chainId, account, tokenAddress);
  }

  // 查詢流水: GET /ledger/history/11155111?account=0x...&page=1
  @Get("history/:chainId")
  async getHistory(@Param("chainId", ParseIntPipe) chainId: number, @Query("account") account: string, @Query("page", new ParseIntPipe({ optional: true })) page = 1) {
    return await this.ledgerService.getAccountHistory(chainId, account, page);
  }
}
