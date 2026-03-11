import { Injectable, Logger, Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BlockchainService } from "../../../modules/blockchain/blockchain.service.js";
import { ConfirmationStrategy } from "./confirmation.strategy.js";
import { DRIZZLE } from "../../../modules/database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../modules/database/schema.js";
import { eq } from "drizzle-orm";

@Injectable()
export class StatusSyncService {
  private readonly logger = new Logger(StatusSyncService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly confirmationStrategy: ConfirmationStrategy,
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>
  ) {}

  // 每分鐘同步一次 Finalized 狀態
  @Cron(CronExpression.EVERY_10_SECONDS)
  async syncFinalizedStatus() {
    try {
      const activeChains = await this.db.query.chainMetadata.findMany({
        where: (table, { eq }) => eq(table.isActive, true),
      });

      for (const chain of activeChains) {
        const chainId = chain.chainId;

        // 1. 獲取鏈上最新高度
        const currentHead = await this.blockchainService.getLatestBlockNumber(chainId);

        // 2. 獲取該鏈的確認深度
        const depth = await this.confirmationStrategy.getConfirmationDepth(chainId);

        // 3. 計算 Safe Block (最終確認點)
        const safeBlock = BigInt(Math.max(0, currentHead - depth));

        // 4. 更新到資料庫
        await this.db
          .update(schema.indexerState)
          .set({
            lastSafeBlock: safeBlock,
            updatedAt: new Date(),
          })
          .where(eq(schema.indexerState.chainId, chainId));

        this.logger.debug(`[Chain ${chainId}] lastSafeBlock updated to ${safeBlock}`);
      }
    } catch (error) {
      this.logger.error(`Status sync error: ${error.message}`);
    }
  }
}
