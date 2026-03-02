# Blockchain Developer

## 技術棧要求：

- Node.js + TypeScript
- Ethers.js 或 Web3.js
- REST API
- 可選：簡單前端（React / TypeScript）展示交易結果
- 使用 Ethereum Testnet（Goerli / Sepolia）或 EVM 兼容鏈

## User Story 1：查詢錢包餘額（Read）

目標：建立一個 REST API，能查詢任意地址的 ETH 和 ERC-20 代幣餘額。

需求：

- `GET /api/balance/:address`
- 回傳：

```json
{
  "address": "0xabc...",
  "ethBalance": "0.123",
  "tokens": [
    { "symbol": "USDT", "balance": "100.5" },
    { "symbol": "DAI", "balance": "50.0" }
  ]
}
```

- 使用 Ethers.js 連接 Testnet provider
- ERC-20 可選幾個示例 token（用 balanceOf 讀取）

## User Story 2：發送交易（Write）

目標：提供 API 讓使用者可以發送 ETH 或 ERC-20 代幣交易。

需求：

- `POST /api/transfer`

```json
{
  "fromPrivateKey": "0x...",
  "to": "0xrecipient...",
  "amount": "0.01",
  "tokenAddress": "0x..." // 可為 null 表示 ETH
}
```

- 後端用 Ethers.js / Signer 發送交易
- 回傳：

```json
{
  "txHash": "0xabc123...",
  "status": "submitted"
}
```

- 設定 gasLimit，處理 nonce

## User Story 3：智能合約事件監聽

目標：監聽一個智能合約事件，將事件記錄到後端 DB 或 log。

需求：

- 監聽 ERC-20 Transfer 事件或自訂合約事件
- 當事件發生：
  - Log from, to, value, txHash
  - 可選：存入 SQLite / JSON file / MongoDB

提示：

```ts
contract.on("Transfer", (from, to, value, event) => {
  console.log(
    `Transfer: ${from} -> ${to}, value: ${ethers.formatUnits(value, 18)}`,
  );
});
```

## User Story 4（進階可選）：合約互動

目標：提供 API 調用自訂合約方法，例如 mint 或 swap。

需求：

- POST `/api/contract/call`

```json
{
  "method": "mint",
  "args": ["0xrecipient...", "1000"]
}
```

- 後端使用 Ethers.js 對智能合約呼叫 method
- 回傳 txHash

## 評分重點（對應 JD）

| 技能             | 評分指標                                        |
| ---------------- | ----------------------------------------------- |
| Node.js Backend  | REST API 設計、錯誤處理、整潔程式碼             |
| Ethers.js / Web3 | Provider/Signer、read/write、事件監聽、交易流程 |
| Blockchain 實務  | Testnet 上成功查餘額、送交易、事件監控          |
| API 整合         | 前端或 Postman 可呼叫 API                       |
| 安全 / Gas       | gasLimit、nonce 處理正確                        |

## 💡 Tips for 面試加分：

- 可以在前端簡單顯示錢包餘額或交易 hash
- 用 environment variables 管理 private keys & RPC URL
- 有事件監聽 → 展示你理解後端如何整合鏈上事件

## Turborepo 專案資料夾結構骨架

```
blockchain-ethers/
├─ package.json                  # Turborepo 根 package.json
├─ turbo.json                    # Turborepo config
├─ yarn.lock
├─ packages/
│   ├─ backend/                  # Nest.js Backend
│   │   ├─ package.json
│   │   ├─ tsconfig.json
│   │   ├─ src/
│   │   │   ├─ main.ts
│   │   │   ├─ app.module.ts
│   │   │   ├─ balance/
│   │   │   │   ├─ balance.module.ts
│   │   │   │   ├─ balance.controller.ts
│   │   │   │   └─ balance.service.ts
│   │   │   ├─ transfer/
│   │   │   │   ├─ transfer.module.ts
│   │   │   │   ├─ transfer.controller.ts
│   │   │   │   └─ transfer.service.ts
│   │   │   └─ events/
│   │   │       ├─ events.module.ts
│   │   │       └─ events.service.ts
│   │   └─ .env
│   └─ frontend/                 # React + TypeScript Frontend
│       ├─ package.json
│       ├─ tsconfig.json
│       ├─ public/
│       │   └─ index.html
│       └─ src/
│           ├─ main.tsx
│           ├─ App.tsx
│           ├─ pages/
│           │   ├─ Home.tsx
│           │   └─ Wallet.tsx
│           ├─ components/
│           │   ├─ WalletCard.tsx
│           │   └─ TransactionForm.tsx
│           └─ services/
│               ├─ api.ts
│               └─ web3.ts

```
