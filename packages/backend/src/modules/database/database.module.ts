import { Module, Global } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { AppConfigService } from "../../config/config.service.js";

export const DRIZZLE = "DRIZZLE_INSTANCE";

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => {
        const connectionString = configService.databaseUrl;
        const client = postgres(connectionString);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
