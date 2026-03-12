# Web3 Exchange-Grade Indexer Architecture (NestJS)

A high-performance Multi-Chain ERC20 token listener and indexer system built with **NestJS** and **React**.
The system adopts an asynchronous architecture using **BullMQ** (Redis) to handle high-concurrency block data and **Drizzle ORM** with **PostgreSQL** for persistent storage.

這是一個基於 **NestJS** 與 **React** 開發的高效能多鏈 ERC20 代幣監聽與索引系統。
專案採用非同步架構，透過 **BullMQ** (Redis) 處理高併發區塊數據，並使用 **Drizzle ORM** 搭配 **PostgreSQL** 進行資料持久化。

---

## 🚀 Key Features | 專案亮點

- **Multi-Chain Support (多鏈支援)**: Extensible listener architecture that supports monitoring ERC20 events across multiple chains simultaneously.
- **Asynchronous Processing (異步處理)**: Utilizes **BullMQ** message queues to implement a producer-consumer patron for stable block indexing.
- **High-Performance ORM (高性能 ORM)**: Powered by **Drizzle ORM**, providing type safety with minimal runtime overhead.
- **Modern Frontend (現代化前端)**: Built with React 19, Vite, and Tailwind CSS v4 for a smooth data visualization experience.
- **Monorepo Management (Monorepo 管理)**: Managed via **Turborepo** for unified dependency handling and optimized build workflows.

---

## 🛠 Tech Stack | 技術棧

### Backend (packages/backend)

- **Framework**: [NestJS](https://nestjs.com/)
- **Blockchain Library**: [Ethers.js v6](https://docs.ethers.org/v6/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Queue System**: [BullMQ](https://docs.bullmq.io/) (Redis)
- **Logging**: [Pino](https://github.com/pinojs/pino)
- **Validation**: Class-validator & Class-transformer

### Frontend (packages/frontend)

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **HTTP Client**: Axios

### Infrastructure

- **Docker**: For deploying isolated PostgreSQL and Redis environments.

---

## 📦 Quick Start | 快速啟動

### 1. Prerequisites | 先決條件

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### 2. Install Dependencies | 安裝依賴

Run the following in the project root:

```bash
npm install
# or
yarn install
```

### 3. Start Infrastructure | 啟動基礎設施

Spin up the required services using Docker:

```bash
# Start PostgreSQL (Default port: 5432)
docker-compose -f docker-compose.postgre.yml up -d

# Start Redis (Default port: 6379)
docker-compose -f docker-compose.redis.yml up -d
```

### 4. Configuration | 環境變數設定

Navigate to `packages/backend`, and create a `.env` file from the example:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `.env` and provide your **RPC_URL** and **DATABASE_URL**.

### 5. Database Migrations (Drizzle) | 資料庫遷移

Initialize your database schema:

```bash
cd packages/backend

# Generate migration files
npx drizzle-kit generate

# Apply migrations to the database
npx drizzle-kit migrate
```

_Note: You can also use `npx drizzle-kit push` for rapid development testing._

### 6. Start Development Server | 啟動開發伺服器

From the project root:

```bash
# Start both backend and frontend in dev mode using Turbo
npm run dev
```

---

## 📂 Project Structure | 目錄結構

```text
multi-chain-erc20-indexer/
├── packages/
│   ├── backend/          # NestJS backend service
│   │   ├── src/
│   │   │   ├── blockchain/   # Chain interaction & Provider management
│   │   │   ├── indexer/      # Data indexing & BullMQ processing
│   │   │   └── database/     # Drizzle Schema & Database Module
│   │   └── drizzle/          # Auto-generated migration files
│   └── frontend/         # React frontend application
├── docker-compose.postgre.yml # PostgreSQL configuration
├── docker-compose.redis.yml   # Redis configuration
├── turbo.json                 # Turborepo configuration
└── package.json               # Root scripts
```

## 📄 License

[MIT License](LICENSE)
