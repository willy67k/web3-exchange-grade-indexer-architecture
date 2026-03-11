import { Injectable, Logger, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/schema.js";
import { gte, and, eq } from "drizzle-orm";

@Injectable()
export class ReorgService {
  private readonly logger = new Logger(ReorgService.name);

  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async handleReorg(chainId: number, forkPoint: number) {
    this.logger.warn(`🚨 REORG DETECTED! Rolling back chain ${chainId} from block ${forkPoint}`);

    await this.db.transaction(async (tx) => {
      // 1. 刪除 Ledger (最重要的資產紀錄)
      await tx.delete(schema.ledgerEntries).where(and(eq(schema.ledgerEntries.chainId, chainId), gte(schema.ledgerEntries.blockNumber, BigInt(forkPoint))));

      // 2. 刪除 Transfers
      await tx.delete(schema.erc20Transfers).where(and(eq(schema.erc20Transfers.chainId, chainId), gte(schema.erc20Transfers.blockNumber, BigInt(forkPoint))));

      // 3. 將這些區塊標記為 orphaned 或直接刪除
      await tx.delete(schema.blocks).where(and(eq(schema.blocks.chainId, chainId), gte(schema.blocks.blockNumber, BigInt(forkPoint))));

      // 4. 重置進度，讓 Poller 下次從 forkPoint 重新掃描
      await tx
        .update(schema.indexerState)
        .set({
          lastProcessedBlock: BigInt(forkPoint - 1),
          updatedAt: new Date(),
        })
        .where(eq(schema.indexerState.chainId, chainId));
    });

    this.logger.log(`✅ Rollback successful. Indexer will resume from ${forkPoint}`);
  }
}
