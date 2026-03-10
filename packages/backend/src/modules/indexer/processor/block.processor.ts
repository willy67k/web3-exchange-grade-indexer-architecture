import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { BLOCK_QUEUE } from "../../../constants/bullqueue.js"; // 確保路徑正確

@Processor(BLOCK_QUEUE)
export class BlockProcessor extends WorkerHost {
  async process(job: Job<any>): Promise<any> {
    console.log(job.data);
    return Promise.resolve({ data: job });
  }
}
