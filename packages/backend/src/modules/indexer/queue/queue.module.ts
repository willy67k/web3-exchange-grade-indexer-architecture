import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BLOCK_QUEUE } from "../../../common/constants/bullQueue.js";
import { AppConfigService } from "../../../config/config.service.js";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        connection: {
          host: configService.redisHost,
          port: configService.redisPort,
        },
      }),
    }),
    BullModule.registerQueue({
      name: BLOCK_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
