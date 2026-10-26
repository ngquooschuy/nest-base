import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE } from '@infra/queue/queue.constants';
import { AuthService } from './auth.service';

@Processor(QUEUE.AUTH)
export class AuthProcessor extends WorkerHost {
  constructor(private readonly auth: AuthService) {
    super();
  }

  async process(job: Job<{ email: string }>): Promise<void> {
    switch (job.name) {
      case 'forgot-password':
        return this.auth.processPasswordReset(job.data.email);
      default:
        throw new Error(`Unknown auth job: ${job.name}`);
    }
  }
}
