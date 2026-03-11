import { Injectable, BadRequestException } from "@nestjs/common";
import { LedgerRepository } from "./ledger.repository.js";
import { isAddress } from "ethers";

@Injectable()
export class LedgerService {
  constructor(private readonly repo: LedgerRepository) {}

  async getAccountBalance(chainId: number, account: string, tokenAddress: string) {
    if (!isAddress(account) || !isAddress(tokenAddress)) {
      throw new BadRequestException("Invalid Ethereum address");
    }
    const rawBalance = await this.repo.getBalance(chainId, account, tokenAddress);
    // 這裡可以根據 Token Decimal 進行轉換，或直接回傳 BigInt 字串
    return {
      chainId,
      account: account.toLowerCase(),
      tokenAddress: tokenAddress.toLowerCase(),
      balance: rawBalance,
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
