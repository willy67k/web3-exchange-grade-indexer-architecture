## 第一步：基礎設施與資料庫實體 (Database & Config)

在寫任何業務邏輯前，先確保資料庫 Schema 與 NestJS 的連接是穩固的。

1. 實作項目：使用 Prisma 或 TypeORM 定義 Entity。
2. 具體動作：
   - 建立 PrismaService 或 TypeORM 配置。
   - 撰寫 Migration 檔案，建立你設計的那 5 張表（blocks, erc20_transfers, ledger_entries, chain_metadata, indexer_state）。
   - 關鍵細節：確保 NUMERIC(78, 0) 用於金額，這是為了處理 ETH/ERC20 的 18 位小數（最大值可達 $2^{256}-1$）。
   - 實作 ConfigService：讀取 .env 中的 RPC URL 和 API Key。

## 第二步：Blockchain 通訊層 (BlockchainService)

這個 Service 負責所有與鏈上的直接對話，不涉及業務邏輯。

1. 實作項目：blockchain/blockchain.service.ts
2. 具體動作：
   - 封裝 ethers.JsonRpcProvider。
   - 實作 getLatestBlockNumber(chainId)。
   - 實作 getBlockWithTransactions(chainId, blockNumber)：獲取區塊細節。
   - 實作 getLogs(chainId, fromBlock, toBlock, topics)：抓取 ERC20 Transfer 事件（Topic0: 0xddf252ad...）。
   - 關鍵細節：實作 RPC 重試機制 (Retry)，使用 rxjs 的 retry 或簡單的 while 迴圈，因為 RPC 經常會逾時或 429。

## 第三步：狀態管理與區塊輪詢 (IndexerState & Poller)

這是系統的「大腦」，決定現在要抓哪一區塊。

1. 實作項目：indexer/block-poller/block-poller.service.ts 與 indexer_state 資料表操作。
2. 具體動作：
   - IndexerStateService：實作 getLastProcessedBlock(chainId) 與 updateLastProcessedBlock(chainId, blockNumber)。
   - BlockPollerService：使用 NestJS 的 @Cron 或 setInterval。
   - 邏輯：
     1. 獲取鏈上最新高度 head。
     2. 從 DB 獲取上次處理的高度 last。
     3. 計算目標範圍：last + 1 到 head - confirmation_blocks (例如減去 12 個區塊確保安全)。
     4. 將需要處理的 block_number 逐一丟進 Redis Queue (BullMQ)。

## 第四步：核心區塊處理器 (BlockProcessor - 最重要)

這是 Worker，負責執行那個巨大的 Atomic DB Transaction。

1. 實作項目：indexer/queue/block.consumer.ts
2. 具體動作：
   - 監聽 Redis 隊列中的 block_number。
   - 核心 Transaction 流程：
     ```ts
     await db.transaction(async (tx) => {
       // 1. 偵測 Reorg (檢查 parentHash 是否匹配 DB 中前一塊的 blockHash)
       // 2. 獲取該區塊所有相關 Logs
       // 3. 解析 Logs 轉換為 erc20_transfers 資料
       // 4. 將 erc20_transfers 拆解為 ledger_entries (From 帳戶 Debit, To 帳戶 Credit)
       // 5. 寫入 blocks 表，狀態標記為 'confirmed'
       // 6. 更新 indexer_state 的 last_processed_block
     });
     ```
   - 關鍵細節：必須處理 Idempotency (冪等性)。如果這個 block 處理到一半掛掉重來，UNIQUE constraint 應該要能保護資料不重複。

## 第五步：Reorg 偵測與自動回滾 (ReorgService)

這是確保資料正確性的最後一道防線。

1. 實作項目：indexer/block-processor/reorg.service.ts
2. 具體動作：
   - 在處理區塊 N 時，比對 N.parentHash !== DB.getBlock(N-1).blockHash。
   - 如果觸發 Reorg：
     1. 停止目前的 Poller。
     2. 往回找直到找到 parentHash 匹配的區塊（Fork Point）。
     3. 執行 SQL：DELETE FROM ... WHERE block_number >= ForkPoint。
     4. 更新 indexer_state 回到 ForkPoint - 1。
     5. 重啟 Poller 從該處重新同步。
