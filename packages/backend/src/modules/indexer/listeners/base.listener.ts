import { Log } from "ethers";
import * as schema from "../../database/schema.js";

export interface ParsedLogs {
  transfer: typeof schema.erc20Transfers.$inferInsert;
  ledgerEntries: Array<Omit<typeof schema.ledgerEntries.$inferInsert, "chainId" | "blockNumber" | "txHash" | "logIndex" | "entryType">>;
}

export interface IBlockListener {
  readonly topic: string;
  name: string;
  parse(log: Log, chainId: number): ParsedLogs;
}
