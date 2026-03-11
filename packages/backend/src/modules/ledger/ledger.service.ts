import { Injectable, BadRequestException } from "@nestjs/common";
import { LedgerRepository } from "./ledger.repository.js";
import { isAddress } from "ethers";

@Injectable()
export class LedgerService {
  constructor(private readonly repo: LedgerRepository) {}

  async getAccountBalance(
    chainId: number,
    account: string,
    tokenAddress: string,
    isFinalizedOnly = false // 新增參數
  ) {
    if (!isAddress(account) || !isAddress(tokenAddress)) {
      throw new BadRequestException("Invalid Ethereum address");
    }

    let rawBalance: string;

    if (isFinalizedOnly) {
      // 呼叫 Repository 獲取安全水位以下的餘額
      rawBalance = await this.repo.getFinalizedBalance(chainId, account, tokenAddress);
    } else {
      // 獲取目前資料庫中已同步的所有餘額
      rawBalance = await this.repo.getBalance(chainId, account, tokenAddress);
    }

    return {
      chainId,
      account: account.toLowerCase(),
      tokenAddress: tokenAddress.toLowerCase(),
      balance: rawBalance,
      isFinalizedOnly,
    };
  }

  async getAccountHistory(chainId: number, account: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const items = await this.repo.findHistory(chainId, account, limit, offset);
    return {
      items,
      page,
      limit,
    };
  }
}
