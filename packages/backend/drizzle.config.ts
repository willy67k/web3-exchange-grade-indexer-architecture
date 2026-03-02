import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.development"),
});

export default defineConfig({
  schema: "./src/modules/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
