1. 設定環境變數：在 .env 加入 DATABASE_URL=postgres://user:pass@localhost:5432/db_name。
2. 生成 Migration：執行 npx drizzle-kit generate。
3. 執行 Migration：執行 npx drizzle-kit migrate (或者使用 push 進行開發測試)。
4. 驗證：進入 PostgreSQL 確認 tables 與 enums 是否正確建立。
