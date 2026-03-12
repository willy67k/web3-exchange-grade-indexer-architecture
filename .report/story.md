# Web3 Exchange-Grade Indexer Architecture (NestJS)

# 🎯 系統目標（Architecture Goals）

這個架構不是「抓 log 玩玩」。

它要達成的是：

## 正確性（Correctness）

- 不漏事件
- 不重複寫入
- Reorg 不污染資料
- 資料可重建（Full Replay）

## 一致性（Consistency）

- 1 Block = 1 Atomic DB Transaction
- 不允許半個 block commit
- 不允許多 worker 同時提交同 block

## 可回滾（Reorg Safe）

- 可偵測 fork
- 可自動 rollback
- 可從 fork point 重建資料

## Append-only Ledger

- 不直接更新 balance
- 所有資產變動寫入 ledger_entries
- Balance 由聚合計算

## 5️⃣ 可擴展（Scalable）

- 支援多鏈
- 支援多合約
- 支援分段重建

## 🏗 系統整體架構

```
RPC Provider
│
▼
Block Poller (single instance)
│
▼
Redis Queue
│
▼
Block Worker (1 block = 1 job)
│
▼
PostgreSQL (ACID)
```

## 🧠 核心設計原則

### Block 是最小原子單位

1 Block = 1 DB Transaction

### 不允許

- log 級 commit
- tx 級 commit
- 部分 block commit

## 資料庫設計（PostgreSQL）

### 1️⃣ blocks

```sql
CREATE TABLE blocks (
  block_number BIGINT PRIMARY KEY,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT NOW()
);
```

說明

- 用來偵測 reorg
- status:
  - confirmed
  - orphaned

### 2️⃣ erc20_transfers

```sql
CREATE TABLE erc20_transfers (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL,
  log_index INT NOT NULL,
  block_number BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tx_hash, log_index)
);
```

為什麼要 UNIQUE(tx_hash, log_index)？

- 避免重抓
- 避免重啟重寫
- 確保 idempotency

### 3️⃣ ledger_entries（核心）

```sql
CREATE TABLE ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  block_number BIGINT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INT NOT NULL,
  account TEXT NOT NULL,
  token_address TEXT NOT NULL,
  delta_amount NUMERIC NOT NULL,
  direction TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tx_hash, log_index, account)
);
```

原則

- 永遠 INSERT
- 永遠不 UPDATE
- 永遠不 DELETE（除非 reorg）

### Balance 計算方式

```sql
SELECT SUM(delta_amount)
FROM ledger_entries
WHERE account = $1
AND token_address = $2;
```

## Reorg Handling 流程

### Step 1 — 偵測

```ts
if (chainBlock.hash !== dbBlock.block_hash) {
  reorgDetected();
}
```

### Step 2 — 找 fork point

從最新 block 向後比對 parent_hash

### Step 3 — Rollback

```sql
DELETE FROM ledger_entries
WHERE block_number >= fork_point;

DELETE FROM erc20_transfers
WHERE block_number >= fork_point;

DELETE FROM blocks
WHERE block_number >= fork_point;
```

### Step 4 — 重新處理 fork_point 之後區塊

## Block Worker Transaction 範例流程

```ts
await db.transaction(async (tx) => {
  // 1. insert transfers
  // 2. insert ledger entries
  // 3. insert block record
});
```

如果其中任何一個失敗：

```
ROLLBACK entire block
```

## Confirmation Strategy

推薦做法：

```
process until currentBlock - 12
```

這樣可以：

- 幾乎避免 reorg
- 降低 rollback 成本

## 多鏈支援設計

增加 chain_id 欄位：

```sql
ALTER TABLE blocks ADD COLUMN chain_id INT NOT NULL;
ALTER TABLE ledger_entries ADD COLUMN chain_id INT NOT NULL;
ALTER TABLE erc20_transfers ADD COLUMN chain_id INT NOT NULL;
```

Primary Key 改為：

```
(chain_id, block_number)
```

## 系統要達到的最終能力

| 能力          | 是否達成 |
| ------------- | -------- |
| 可補歷史      | ✅       |
| 可即時追蹤    | ✅       |
| 可偵測 reorg  | ✅       |
| 可 rollback   | ✅       |
| 資料可 replay | ✅       |
| Ledger 一致性 | ✅       |
| 多鏈支援      | ✅       |
| 交易所級設計  | ✅       |
