import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export const DRIZZLE = "DRIZZLE_INSTANCE";

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>("DATABASE_URL");
        if (!connectionString) {
          throw new Error("DATABASE_URL is not defined in config");
        }
        const client = postgres(connectionString);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
