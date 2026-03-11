import { Injectable, Logger, Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { BlockchainService } from "../../blockchain/blockchain.service.js";
import { DRIZZLE } from "../../database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/schema.js";
import { BLOCK_QUEUE } from "../../../common/constants/bullQueue.js";
import { ConfirmationStrategy } from "./confirmation.strategy.js"; // 導入策略

@Injectable()
export class BlockPollerService {
  private readonly logger = new Logger(BlockPollerService.name);
  private isPolling = false;

  constructor(
    @InjectQueue(BLOCK_QUEUE) private blockQueue: Queue,
    private readonly blockchainService: BlockchainService,
    private readonly confirmationStrategy: ConfirmationStrategy, // 1. 注入策略
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      // 1. 獲取所有活耀中的鏈配置
      const activeChains = await this.db.query.chainMetadata.findMany({
        where: (table, { eq }) => eq(table.isActive, true),
      });

      for (const chain of activeChains) {
        // 2. 這裡不再直接傳數字，交給 pollChain 內部處理或傳遞 chain 物件
        await this.pollChain(chain.chainId);
      }
    } catch (error) {
      this.logger.error(`Polling error: ${error.message}`);
    } finally {
      this.isPolling = false;
    }
  }

  private async pollChain(chainId: number) {
    // 3. 獲取鏈上最新高度
    const currentRpcBlock = await this.blockchainService.getLatestBlockNumber(chainId);

    // 4. 使用策略獲取該鏈的安全深度
    const confirmationDepth = await this.confirmationStrategy.getConfirmationDepth(chainId);
    const safeBlock = currentRpcBlock - confirmationDepth;

    // 3. 從資料庫獲取上次同步的高度
    let state = await this.db.query.indexerState.findFirst({
      where: (table, { eq }) => eq(table.chainId, chainId),
    });

    // 如果是新鏈，初始化 state
    if (!state) {
      [state] = await this.db
        .insert(schema.indexerState)
        .values({
          chainId,
          lastProcessedBlock: BigInt(safeBlock - 1),
          lastSafeBlock: BigInt(safeBlock),
        })
        .returning();
    }

    const startBlock = Number(state.lastProcessedBlock) + 1;
    const endBlock = safeBlock;

    if (startBlock <= endBlock) {
      this.logger.log(`Chain ${chainId}: Dispatching blocks ${startBlock} -> ${endBlock} (Depth: ${confirmationDepth})`);

      // 4. 將區塊批次丟入 BullMQ
      const jobs = [];
      for (let b = startBlock; b <= endBlock; b++) {
        jobs.push({
          name: "process_block",
          data: { chainId, blockNumber: b },
          opts: {
            jobId: `block-${chainId}-${b}`, // 確保唯一性，防止重複派發
            attempts: 5,
            backoff: { type: "exponential", delay: 2000 },
          },
        });
      }

      await this.blockQueue.addBulk(jobs);

      // 注意：這裡不更新 DB 的 lastProcessedBlock
      // 必須等 Worker (Consumer) 真正處理完 block 並 commit transaction 後才更新
    }
  }
}
