```text
src/
│
├── main.ts
├── app.module.ts
│
├── config/
│   ├── config.module.ts
│   └── config.service.ts
│
├── database/
│   ├── database.module.ts
│   ├── prisma.service.ts (或 typeorm)
│   └── migrations/
│
├── blockchain/
│   ├── blockchain.module.ts
│   ├── blockchain.service.ts
│   └── chain.registry.ts        # 多鏈 provider 管理
│
├── indexer/
│   ├── indexer.module.ts
│   │
│   ├── block-poller/
│   │   ├── block-poller.service.ts
│   │   └── confirmation.strategy.ts
│   │
│   ├── block-processor/
│   │   ├── block-processor.service.ts
│   │   └── reorg.service.ts
│   │
│   ├── listeners/
│   │   ├── erc20.listener.ts
│   │   ├── erc721.listener.ts
│   │   └── dex-swap.listener.ts
│   │
│   └── queue/
│       ├── queue.module.ts
│       ├── block.consumer.ts
│       └── block.producer.ts
│
├── ledger/
│   ├── ledger.module.ts
│   ├── ledger.service.ts
│   └── ledger.repository.ts
│
├── domain/
│   ├── blocks/
│   ├── transfers/
│   └── accounts/
│
└── common/
    ├── enums/
    ├── utils/
    └── constants/
```
