import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { JsonRpcProvider } from "ethers";
import { Inject } from "@nestjs/common";
import { DRIZZLE } from "../database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../database/schema.js";

@Injectable()
export class ChainRegistry implements OnModuleInit {
  private readonly logger = new Logger(ChainRegistry.name);
  private providers: Map<number, JsonRpcProvider> = new Map();

  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async onModuleInit() {
    await this.refreshProviders();
  }

  async refreshProviders() {
    const chains = await this.db.query.chainMetadata.findMany({
      where: (table, { eq }) => eq(table.isActive, true),
    });

    for (const chain of chains) {
      const provider = new JsonRpcProvider(chain.rpcUrl, undefined, {
        staticNetwork: true, // 效能優化：不需每次調用都查詢 chainId
      });
      this.providers.set(chain.chainId, provider);
      this.logger.log(`Chain ${chain.chainId} (${chain.chainName}) initialized.`);
    }
  }

  getProvider(chainId: number): JsonRpcProvider {
    const provider = this.providers.get(chainId);
    if (!provider) throw new Error(`Provider for chain ${chainId} not found or inactive`);
    return provider;
  }
}
