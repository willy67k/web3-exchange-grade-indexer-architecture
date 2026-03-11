import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Inject, Logger } from "@nestjs/common";
import { BlockchainService } from "../../../modules/blockchain/blockchain.service.js";
import { DRIZZLE } from "../../../modules/database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../modules/database/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { IBlockListener } from "../listeners/base.listener.js";
import { ReorgService } from "../block-processor/reorg.service.js";
import { BLOCK_QUEUE } from "../../../common/constants/bullQueue.js";
import { BLOCK_LISTENERS } from "../../../common/constants/blockListener.js";

@Processor(BLOCK_QUEUE)
export class BlockConsumer extends WorkerHost {
  private readonly logger = new Logger(BlockConsumer.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly reorgService: ReorgService,
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    @Inject(BLOCK_LISTENERS) private listeners: IBlockListener[]
  ) {
    super();
  }

  async process(job: Job<{ chainId: number; blockNumber: number }>) {
    const { chainId, blockNumber } = job.data;

    // 1. 同時獲取區塊資訊與所有感興趣的 Logs (所有 Listener 的 Topics 聯集)
    const topics = this.listeners.map((l) => l.topic);
    const [block, logs] = await Promise.all([this.blockchainService.getBlock(chainId, blockNumber), this.blockchainService.getLogs(chainId, blockNumber, blockNumber, topics)]);

    if (!block) throw new Error(`Block ${blockNumber} missing`);

    // 2. 執行原子交易
    await this.db.transaction(async (tx) => {
      // A. Reorg 檢查：驗證前一塊 Hash 是否與當前區塊的 parentHash 一致
      await this.checkReorg(tx, chainId, blockNumber, block.parentHash);

      // B. 寫入區塊狀態
      await tx
        .insert(schema.blocks)
        .values({
          chainId,
          blockNumber: BigInt(blockNumber),
          blockHash: block.hash!,
          parentHash: block.parentHash,
          status: "confirmed",
          processedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.blocks.chainId, schema.blocks.blockNumber],
          set: { blockHash: block.hash!, status: "confirmed" },
        });

      // C. 分發 Logs 給 Listeners 解析
      for (const log of logs) {
        const listener = this.listeners.find((l) => l.topic === log.topics[0]);
        if (!listener) continue;

        const { transfer, ledgerEntries } = listener.parse(log, chainId);

        // 寫入 Transfer 原始紀錄
        await tx.insert(schema.erc20Transfers).values(transfer).onConflictDoNothing();

        // 寫入複式記帳 Ledger
        for (const entry of ledgerEntries) {
          await tx
            .insert(schema.ledgerEntries)
            .values({
              ...entry,
              chainId,
              blockNumber: BigInt(blockNumber),
              txHash: log.transactionHash,
              logIndex: log.index,
              entryType: listener.name.toLowerCase() as (typeof schema.ledgerEntryTypeEnum.enumValues)[number],
            })
            .onConflictDoNothing();
        }
      }

      // D. 更新索引狀態
      await tx
        .insert(schema.indexerState)
        .values({
          chainId,
          lastProcessedBlock: BigInt(blockNumber),
          lastSafeBlock: BigInt(blockNumber), // 初始插入時設為同值
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.indexerState.chainId],
          set: {
            // 這裡只更新 Processed，不更新 Safe，交給 StatusSyncService 處理
            lastProcessedBlock: sql`GREATEST(${schema.indexerState.lastProcessedBlock}, ${BigInt(blockNumber)})`,
            updatedAt: new Date(),
          },
        });
    });

    this.logger.log(`[Chain ${chainId}] Block ${blockNumber} processed.`);
  }

  private async checkReorg(tx: PostgresJsDatabase<typeof schema>, chainId: number, blockNumber: number, parentHash: string) {
    if (blockNumber <= 1) return;

    const prevBlock = await tx.query.blocks.findFirst({
      where: and(eq(schema.blocks.chainId, chainId), eq(schema.blocks.blockNumber, BigInt(blockNumber - 1))),
    });

    if (prevBlock && prevBlock.blockHash !== parentHash) {
      this.logger.error(`Reorg detected at ${blockNumber}!`);
      // 這裡直接調用 reorgService.handleReorg，該服務會清理 DB 並重置 state
      await this.reorgService.handleReorg(chainId, blockNumber);
      throw new Error(`Reorg handled at ${blockNumber}, job will retry`);
    }
  }
}
