import { Inject, Injectable } from "@nestjs/common";
// import { ChainId } from "../../../common/enums/chain.enum.js";
import { DRIZZLE } from "../../database/database.module.js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/schema.js";
import { eq } from "drizzle-orm";

@Injectable()
export class ConfirmationStrategy {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async getConfirmationDepth(chainId: number): Promise<number> {
    try {
      const chain = await this.db.query.chainMetadata.findFirst({
        where: eq(schema.chainMetadata.chainId, chainId),
      });

      // 優先使用資料庫設定，沒有的話才給預設值
      return chain?.confirmationBlocks ?? 12;
    } catch (error) {
      console.log(error);
      return 12;
    }
  }

  // 根據 ChainId 獲取安全確認區塊數
  //   getConfirmationDepth(chainId: number): number {
  //     switch (chainId as ChainId) {
  //       case ChainId.ETHEREUM:
  //         return 12;
  //       case ChainId.ARBITRUM:
  //         return 1;
  //       case ChainId.SEPOLIA:
  //         return 2;
  //       case ChainId.POLYGON:
  //         return 200;
  //       default:
  //         return 12; // 預設安全值
  //     }
  //   }

  // 判斷是否為「最終確認」
  async isFinalized(chainId: number, currentBlock: number, targetBlock: number): Promise<boolean> {
    try {
      const depth = await this.getConfirmationDepth(chainId);
      return currentBlock - targetBlock >= depth;
    } catch (error) {
      console.log(error);
      throw new Error("Couldn't finalized");
    }
  }
}
