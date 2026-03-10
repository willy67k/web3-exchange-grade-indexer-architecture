import { Injectable, Logger } from "@nestjs/common";
import { Block, Filter, Log } from "ethers";
import { ChainRegistry } from "./chain.registry.js";

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private readonly registry: ChainRegistry) {}

  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        const delay = Math.pow(2, i) * 1000; // 指數退避 (Exponential Backoff)
        this.logger.warn(`RPC Error, retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw new Error("Max retries reached");
  }

  async getLatestBlockNumber(chainId: number): Promise<number> {
    const provider = this.registry.getProvider(chainId);
    return await this.withRetry(() => provider.getBlockNumber());
  }

  // 獲取區塊 Header（包含 parentHash 用於 Reorg 檢查）
  async getBlock(chainId: number, blockNumber: number): Promise<Block | null> {
    const provider = this.registry.getProvider(chainId);
    return await this.withRetry(() => provider.getBlock(blockNumber));
  }

  // 抓取 Logs (例如 ERC20 Transfer)
  async getLogs(chainId: number, fromBlock: number, toBlock: number, topics: string[]): Promise<Log[]> {
    const provider = this.registry.getProvider(chainId);
    const filter: Filter = {
      fromBlock,
      toBlock,
      topics: [topics], // 第一個 Topic 通常是 Event Signature
    };
    return await this.withRetry(() => provider.getLogs(filter));
  }
}
