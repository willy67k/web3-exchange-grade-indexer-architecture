```sql
CREATE TABLE blocks (
  chain_id INT NOT NULL,
  block_number BIGINT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  status block_status_enum NOT NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (chain_id, block_number)
);
```

```sql
CREATE TYPE block_status_enum AS ENUM (
  'pending',      -- 尚未處理
  'processing',   -- worker 處理中
  'confirmed',    -- 已確認
  'orphaned',     -- reorg 廢棄
  'failed'        -- 處理失敗
);
```

```sql
CREATE TABLE erc20_transfers (
  id BIGSERIAL PRIMARY KEY,
  chain_id INT NOT NULL,
  block_number BIGINT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INT NOT NULL,
  token_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  status transfer_status_enum NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(chain_id, tx_hash, log_index)
);
```

```sql
CREATE TYPE transfer_status_enum AS ENUM (
  'valid',        -- 正常事件
  'reverted',     -- 因 reorg 廢棄
  'ignored'       -- 非關注 token
);
```

```sql
CREATE TABLE ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  chain_id INT NOT NULL,
  block_number BIGINT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INT NOT NULL,
  account TEXT NOT NULL,
  token_address TEXT NOT NULL,
  delta_amount NUMERIC(78, 0) NOT NULL,
  direction ledger_direction_enum NOT NULL,
  entry_type ledger_entry_type_enum NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(chain_id, tx_hash, log_index, account)
);
```

```sql
CREATE TYPE ledger_direction_enum AS ENUM (
  'credit',
  'debit'
);
```

```sql
CREATE TYPE ledger_entry_type_enum AS ENUM (
  'erc20_transfer',
  'erc721_mint',
  'dex_swap',
  'deposit',
  'withdraw',
  'fee',
  'liquidation',
  'manual_adjustment'
);
-- 這讓你未來：
-- 支援交易所內部帳務
-- 支援手續費
-- 支援清算
```

```sql
CREATE TABLE chain_metadata (
  chain_id INT PRIMARY KEY,
  chain_name TEXT NOT NULL,
  rpc_url TEXT NOT NULL,
  confirmation_blocks INT NOT NULL DEFAULT 12,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

```sql
CREATE TABLE indexer_state (
  chain_id INT PRIMARY KEY,
  last_processed_block BIGINT NOT NULL,
  last_safe_block BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
-- 用途：
-- 重啟時從哪繼續
-- 不需要掃整鏈
```

## 為什麼要 block.status？

因為多 worker 時：

```
pending → processing → confirmed
```

Reorg 發生時：

```
confirmed → orphaned
```

這是狀態機。

## 為什麼 ledger 要 entry_type？

因為未來你會：

- 混合鏈上 + 鏈下
- 做內部轉帳
- 做清算
- 做手續費分潤

沒有 entry_type 你會爆。
