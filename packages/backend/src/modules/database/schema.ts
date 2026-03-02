import { pgTable, bigint, text, timestamp, numeric, integer, unique, pgEnum, primaryKey, bigserial } from "drizzle-orm/pg-core";

export const blockStatusEnum = pgEnum("block_status", ["pending", "processing", "confirmed", "orphaned", "failed"]);
export const transferStatusEnum = pgEnum("transfer_status", ["valid", "reverted", "ignored"]);
export const ledgerDirectionEnum = pgEnum("ledger_direction", ["credit", "debit"]);
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", ["erc20_transfer", "erc721_mint", "dex_swap", "deposit", "withdraw", "fee", "liquidation", "manual_adjustment"]);

export const blocks = pgTable(
  "blocks",
  {
    chainId: integer("chain_id").notNull(),
    blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
    blockHash: text("block_hash").notNull(),
    parentHash: text("parent_hash").notNull(),
    status: blockStatusEnum("status").default("confirmed").notNull(),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chainId, table.blockNumber] }),
  })
);

export const erc20Transfers = pgTable(
  "erc20_transfers",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    chainId: integer("chain_id").notNull(),
    blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
    txHash: text("tx_hash").notNull(),
    logIndex: integer("log_index").notNull(),
    tokenAddress: text("token_address").notNull(),
    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address").notNull(),
    amount: numeric("amount", { precision: 78, scale: 0 }).notNull(),
    status: transferStatusEnum("status").default("valid").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueTransfer: unique().on(table.chainId, table.txHash, table.logIndex),
  })
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    chainId: integer("chain_id").notNull(),
    blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
    txHash: text("tx_hash").notNull(),
    logIndex: integer("log_index").notNull(),
    account: text("account").notNull(),
    tokenAddress: text("token_address").notNull(),
    deltaAmount: numeric("delta_amount", { precision: 78, scale: 0 }).notNull(),
    direction: ledgerDirectionEnum("direction").notNull(),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueLedger: unique().on(table.chainId, table.txHash, table.logIndex, table.account),
  })
);

export const indexerState = pgTable("indexer_state", {
  chainId: integer("chain_id").primaryKey(),
  lastProcessedBlock: bigint("last_processed_block", { mode: "bigint" }).notNull(),
  lastSafeBlock: bigint("last_safe_block", { mode: "bigint" }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
