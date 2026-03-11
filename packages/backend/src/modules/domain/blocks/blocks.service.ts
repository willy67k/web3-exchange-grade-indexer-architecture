import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../../modules/database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../modules/database/schema.js";
import { eq, sql } from "drizzle-orm";

@Injectable()
export class BlocksDomainService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  // 檢查是否有遺漏的區塊 (Gap Detection)
  async findGaps(chainId: number, from: bigint, to: bigint) {
    const query = sql`
      SELECT generate_series(${from}, ${to}) AS missing_block
      EXCEPT
      SELECT ${schema.blocks.blockNumber} FROM ${schema.blocks}
      WHERE ${schema.blocks.chainId} = ${chainId}
    `;
    return await this.db.execute(query);
  }

  // 獲取區塊同步進度摘要
  async getSyncStatus(chainId: number) {
    const [result] = await this.db
      .select({
        latestProcessed: sql<bigint>`MAX(${schema.blocks.blockNumber})`,
        totalProcessed: sql<number>`COUNT(*)`,
      })
      .from(schema.blocks)
      .where(eq(schema.blocks.chainId, chainId));
    return result;
  }
}
