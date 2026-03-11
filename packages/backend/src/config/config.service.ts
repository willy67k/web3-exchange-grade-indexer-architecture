import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private config: ConfigService) {}

  get port(): number {
    return this.config.get<number>("PORT", 6970);
  }

  get frontendUrl(): string {
    return this.config.get<string>("FRONTEND_URL", "http://localhost:6969");
  }

  get databaseUrl(): string {
    return this.config.getOrThrow<string>("DATABASE_URL");
  }

  get redisHost(): string {
    return this.config.get<string>("REDIS_HOST", "localhost");
  }

  get redisPort(): number {
    return this.config.get<number>("REDIS_PORT", 6379);
  }

  get rpcUrl(): string {
    return this.config.getOrThrow<string>("RPC_URL");
  }

  get nodeEnv(): string {
    return this.config.get<string>("NODE_ENV", "development");
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  get isVercel(): boolean {
    return !!(this.config.get("VERCEL") || this.config.get("VITE_VERCEL_ENV"));
  }
}
