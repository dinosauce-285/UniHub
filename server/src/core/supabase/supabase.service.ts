import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      'mock-key';

    if (supabaseUrl && supabaseKey !== 'mock-key') {
      this.client = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn('Supabase URL or Key is missing. Storage might not work.');
      this.client = createClient(supabaseUrl || 'https://mock.supabase.co', supabaseKey);
    }
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
