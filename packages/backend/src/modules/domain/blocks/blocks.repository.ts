import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../../modules/database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../modules/database/schema.js";
import { eq } from "drizzle-orm";

@Injectable()
export class BlocksRepository {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async getIndexerState(chainId: number) {
    return await this.db.query.indexerState.findFirst({
      where: eq(schema.indexerState.chainId, chainId),
    });
  }

  async updateLastProcessed(chainId: number, blockNumber: bigint, tx?: any) {
    const client = tx || this.db;
    return await client
      .insert(schema.indexerState)
      .values({
        chainId,
        lastProcessedBlock: blockNumber,
        lastSafeBlock: blockNumber,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.indexerState.chainId],
        set: { lastProcessedBlock: blockNumber, updatedAt: new Date() },
      });
  }
}
