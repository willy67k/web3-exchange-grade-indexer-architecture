import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Inject, Logger } from "@nestjs/common";
import { BlockchainService } from "../../blockchain/blockchain.service.js";
import { DRIZZLE } from "../../database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { BLOCK_QUEUE } from "../../../constants/bullQueue.js";
import { ERC20_TRANSFER_TOPIC } from "../../../constants/blockchainTopic.js";

@Processor(BLOCK_QUEUE)
export class BlockConsumer extends WorkerHost {
  private readonly logger = new Logger(BlockConsumer.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>
  ) {
    super();
  }

  async process(job: Job<{ chainId: number; blockNumber: number }>) {
    const { chainId, blockNumber } = job.data;

    // 1. 獲取區塊與 Logs
    const [block, logs] = await Promise.all([this.blockchainService.getBlock(chainId, blockNumber), this.blockchainService.getLogs(chainId, blockNumber, blockNumber, [ERC20_TRANSFER_TOPIC])]);

    if (!block) throw new Error(`Block ${blockNumber} not found on chain ${chainId}`);

    // 2. 開啟原子級 DB Transaction
    await this.db.transaction(async (tx) => {
      // A. Reorg 檢查 (檢查前一塊 Hash)
      if (blockNumber > 1) {
        const prevBlock = await tx.query.blocks.findFirst({
          where: and(eq(schema.blocks.chainId, chainId), eq(schema.blocks.blockNumber, BigInt(blockNumber - 1))),
        });

        if (prevBlock && prevBlock.blockHash !== block.parentHash) {
          // 這裡拋出錯誤會導致 Job 失敗並進入重試，或在此觸發 ReorgService
          throw new Error(`Reorg detected at block ${blockNumber}! Expected parent ${prevBlock.blockHash}, got ${block.parentHash}`);
        }
      }

      // B. 寫入區塊資訊
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

      // C. 處理並解析 Logs
      for (const log of logs) {
        // ethers v6 解析方式 (簡單處理，實際可增加更強的 ABI Decoder)
        const from = `0x${log.topics[1].slice(26)}`;
        const to = `0x${log.topics[2].slice(26)}`;
        const amount = BigInt(log.data).toString();

        // 寫入 erc20_transfers
        await tx
          .insert(schema.erc20Transfers)
          .values({
            chainId,
            blockNumber: BigInt(blockNumber),
            txHash: log.transactionHash,
            logIndex: log.index,
            tokenAddress: log.address.toLowerCase(),
            fromAddress: from.toLowerCase(),
            toAddress: to.toLowerCase(),
            amount: amount,
            status: "valid",
          })
          .onConflictDoNothing();

        // D. 寫入 Ledger Entries (複式記帳邏輯)
        // Debit From
        await tx
          .insert(schema.ledgerEntries)
          .values({
            chainId,
            blockNumber: BigInt(blockNumber),
            txHash: log.transactionHash,
            logIndex: log.index,
            account: from.toLowerCase(),
            tokenAddress: log.address.toLowerCase(),
            deltaAmount: `-${amount}`, // 支出為負
            direction: "debit",
            entryType: "erc20_transfer",
          })
          .onConflictDoNothing();

        // Credit To
        await tx
          .insert(schema.ledgerEntries)
          .values({
            chainId,
            blockNumber: BigInt(blockNumber),
            txHash: log.transactionHash,
            logIndex: log.index,
            account: to.toLowerCase(),
            tokenAddress: log.address.toLowerCase(),
            deltaAmount: amount, // 存入為正
            direction: "credit",
            entryType: "erc20_transfer",
          })
          .onConflictDoNothing();
      }

      // E. 更新同步進度
      await tx
        .insert(schema.indexerState)
        .values({
          chainId,
          lastProcessedBlock: BigInt(blockNumber),
          lastSafeBlock: BigInt(blockNumber),
        })
        .onConflictDoUpdate({
          target: [schema.indexerState.chainId],
          set: { lastProcessedBlock: BigInt(blockNumber), updatedAt: new Date() },
        });
    });

    this.logger.log(`Successfully processed block ${blockNumber} for chain ${chainId}`);
  }
}
