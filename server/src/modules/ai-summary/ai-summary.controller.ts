import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../../../generated/prisma/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiSummaryService } from './ai-summary.service';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('workshops/:workshopId/ai-summary')
export class AiSummaryController {
  constructor(private readonly aiSummaryService: AiSummaryService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_PDF_SIZE_BYTES,
      },
    }),
  )
  async create(
    @Param('workshopId') workshopId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    this.validatePdfFile(file);

    return this.aiSummaryService.enqueueSummary(workshopId, file);
  }

  private validatePdfFile(
    file: Express.Multer.File | undefined,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    const hasPdfExtension = file.originalname.toLowerCase().endsWith('.pdf');
    const looksLikePdf = file.buffer.subarray(0, 4).toString('ascii') === '%PDF';

    if (!hasPdfExtension || file.mimetype !== 'application/pdf' || !looksLikePdf) {
      throw new BadRequestException('Only PDF files are accepted');
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      throw new BadRequestException('PDF file must be 10 MB or smaller');
    }
  }
}
