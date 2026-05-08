import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Role } from '../../../generated/prisma/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import { StudentsService } from './students.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  listStudents(@Query() query: ListStudentsQueryDto) {
    return this.studentsService.listStudents(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  getStudent(@Param('id') id: string) {
    return this.studentsService.getStudent(id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  async importStudents(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.validateCsvFile(file);

    const result = await this.studentsService.importCsv(file.buffer);
    response.status(result.skipped > 0 ? 207 : 201);

    return result;
  }

  private validateCsvFile(
    file: Express.Multer.File | undefined,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const hasCsvExtension = file.originalname.toLowerCase().endsWith('.csv');
    if (!hasCsvExtension || file.mimetype !== 'text/csv') {
      throw new BadRequestException('Only CSV files are accepted');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('CSV file must be 5 MB or smaller');
    }
  }
}
