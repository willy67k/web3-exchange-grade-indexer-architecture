import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../modules/database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../modules/database/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

@Injectable()
export class LedgerRepository {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  // 核心：利用 SUM 聚合所有 Delta 算出餘額
  async getBalance(chainId: number, account: string, tokenAddress: string) {
    const [result] = await this.db
      .select({
        balance: sql<string>`COALESCE(SUM(${schema.ledgerEntries.deltaAmount}), 0)`,
      })
      .from(schema.ledgerEntries)
      .where(and(eq(schema.ledgerEntries.chainId, chainId), eq(schema.ledgerEntries.account, account.toLowerCase()), eq(schema.ledgerEntries.tokenAddress, tokenAddress.toLowerCase())));
    return result.balance;
  }

  // 分頁查詢帳目流水
  async findHistory(chainId: number, account: string, limit: number, offset: number) {
    return await this.db.query.ledgerEntries.findMany({
      where: and(eq(schema.ledgerEntries.chainId, chainId), eq(schema.ledgerEntries.account, account.toLowerCase())),
      orderBy: [desc(schema.ledgerEntries.blockNumber), desc(schema.ledgerEntries.logIndex)],
      limit,
      offset,
    });
  }

  async getFinalizedBalance(chainId: number, account: string, tokenAddress: string) {
    // 1. 從進度表拿到該鏈的「安全水位線」
    const state = await this.db.query.indexerState.findFirst({
      where: (table, { eq }) => eq(table.chainId, chainId),
    });

    const safeLimit = state?.lastSafeBlock ?? 0n;

    // 2. 查詢特定代幣、特定帳戶、在安全區塊內的餘額
    const [result] = await this.db
      .select({
        balance: sql<string>`COALESCE(SUM(${schema.ledgerEntries.deltaAmount}), '0')`,
      })
      .from(schema.ledgerEntries)
      .where(
        and(
          eq(schema.ledgerEntries.chainId, chainId),
          eq(schema.ledgerEntries.account, account.toLowerCase()),
          eq(schema.ledgerEntries.tokenAddress, tokenAddress.toLowerCase()),
          sql`${schema.ledgerEntries.blockNumber} <= ${safeLimit}`
        )
      );

    return result?.balance || "0";
  }
}
