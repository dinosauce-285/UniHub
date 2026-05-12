import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

type AiSummaryJob = {
  workshopId: string;
  filePath: string;
  originalName: string;
};

type GroqChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const AI_SUMMARY_QUEUE = 'ai-summary';
const AI_SUMMARY_JOB = 'generate-workshop-summary';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_MAX_SOURCE_CHARS = 18_000;

@Injectable()
export class AiSummaryService implements OnModuleDestroy {
  private readonly queue = new Queue<AiSummaryJob>(AI_SUMMARY_QUEUE, {
    connection: this.createRedisConnection(),
  });
  private readonly worker = new Worker<AiSummaryJob>(
    AI_SUMMARY_QUEUE,
    (job) => this.processSummaryJob(job),
    {
      connection: this.createRedisConnection(),
      concurrency: 1,
    },
  );

  private readonly logger = new Logger(AiSummaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
      if (this.isFinalAttempt(job)) {
        void this.cleanupTempFile(job?.data.filePath);
      }
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
  }

  async enqueueSummary(workshopId: string, file: Express.Multer.File) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { id: true },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    const filePath = await this.saveTempPdf(file);
    const job = await this.queue.add(
      AI_SUMMARY_JOB,
      {
        workshopId,
        filePath,
        originalName: file.originalname,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30_000,
        },
        removeOnComplete: 50,
        removeOnFail: false,
      },
    );

    return {
      queued: true,
      jobId: job.id,
      workshopId,
      model: this.getGroqModel(),
    };
  }

  async generatePreviewSummary(file: Express.Multer.File) {
    const summary = await this.generateSummaryFromPdfBuffer(file.buffer);

    return { summary };
  }

  private async processSummaryJob(job: Job<AiSummaryJob>) {
    const { data: fileData, error } = await this.supabaseService
      .getClient()
      .storage.from('unihub-uploads')
      .download(job.data.filePath);

    if (error || !fileData) {
      throw new Error(`Failed to download PDF from Supabase: ${error?.message}`);
    }

    const pdfBuffer = Buffer.from(await fileData.arrayBuffer());
    const summary = await this.generateSummaryFromPdfBuffer(pdfBuffer);

    await this.prisma.workshop.update({
      where: { id: job.data.workshopId },
      data: { aiSummary: summary },
    });

    await this.cleanupTempFile(job.data.filePath);

    return {
      workshopId: job.data.workshopId,
      summaryLength: summary.length,
    };
  }

  private async generateSummaryFromPdfBuffer(pdfBuffer: Buffer) {
    const rawText = await this.extractPdfText(pdfBuffer);
    const cleanedText = this.cleanText(rawText);

    if (!cleanedText) {
      throw new BadRequestException('PDF does not contain extractable text');
    }

    return this.generateSummary(cleanedText);
  }

  private async extractPdfText(pdfBuffer: Buffer) {
    const parser = new PDFParse({ data: pdfBuffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  private cleanText(text: string) {
    return text
      .replace(/\u0000/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, this.getMaxSourceChars());
  }

  private async generateSummary(sourceText: string) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required for AI summary generation');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.getGroqModel(),
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          {
            role: 'system',
            content:
              'You summarize university workshop PDFs for students. Keep the summary factual, concise, and in the same language as the source document.',
          },
          {
            role: 'user',
            content:
              'Summarize this workshop PDF in 3-5 sentences. Include the topic, target audience, key outcomes, and any prerequisite or schedule signal if present.\n\n' +
              sourceText,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq summary request failed: ${response.status} ${detail}`);
    }

    const data = (await response.json()) as GroqChatCompletion;
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error('Groq summary response did not include content');
    }

    return summary;
  }

  private async saveTempPdf(file: Express.Multer.File) {
    const filename = `ai-summary/tmp-${randomUUID()}.pdf`;
    const { error } = await this.supabaseService
      .getClient()
      .storage.from('unihub-uploads')
      .upload(filename, file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    return filename;
  }

  private getGroqModel() {
    return this.configService.get<string>('GROQ_MODEL') ?? DEFAULT_GROQ_MODEL;
  }

  private getMaxSourceChars() {
    const value = Number(this.configService.get<string>('AI_SUMMARY_MAX_SOURCE_CHARS'));
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_SOURCE_CHARS;
  }

  private createRedisConnection() {
    return {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      maxRetriesPerRequest: null,
    };
  }

  private isFinalAttempt(job: Job<AiSummaryJob> | undefined) {
    if (!job) {
      return false;
    }

    const attempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
    return job.attemptsMade >= attempts;
  }

  private async cleanupTempFile(filePath: string | undefined) {
    if (!filePath) {
      return;
    }

    try {
      await this.supabaseService.getClient().storage.from('unihub-uploads').remove([filePath]);
    } catch {
      // The temp file may already be removed after a successful retry.
    }
  }
}
