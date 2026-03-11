import { Injectable } from "@nestjs/common";
import { LedgerService } from "../../ledger/ledger.service.js";

@Injectable()
export class AccountsDomainService {
  constructor(private readonly ledgerService: LedgerService) {}

  // 獲取用戶的「資產組合」(Portfolio)
  async getPortfolio(chainId: number, account: string, tokenList: string[]) {
    const balances = await Promise.all(
      tokenList.map(async (token) => {
        const data = await this.ledgerService.getAccountBalance(chainId, account, token);
        return {
          tokenAddress: token,
          balance: data.balance,
        };
      })
    );

    return {
      account,
      chainId,
      assets: balances.filter((b) => BigInt(b.balance) > 0n), // 只回傳有餘額的
    };
  }
}
