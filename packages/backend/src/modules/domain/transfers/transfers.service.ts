import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../../modules/database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../modules/database/schema.js";
import { gte, and, eq, desc } from "drizzle-orm";

@Injectable()
export class TransfersDomainService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  // 獲取特定金額以上的「大額轉帳」(Whale Alert 邏輯)
  async getWhaleTransfers(chainId: number, minAmount: string, limit = 10) {
    return await this.db.query.erc20Transfers.findMany({
      where: and(eq(schema.erc20Transfers.chainId, chainId), gte(schema.erc20Transfers.amount, minAmount)),
      orderBy: [desc(schema.erc20Transfers.blockNumber)],
      limit,
    });
  }
}
