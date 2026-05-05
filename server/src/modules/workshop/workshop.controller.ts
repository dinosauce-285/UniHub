import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { UpdateWorkshopStatusDto } from './dto/update-workshop-status.dto';
import { WorkshopService } from './workshop.service';

const MAX_ROOM_MAP_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('workshops')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get()
  list() {
    return this.workshopService.list();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  listForOrganizer() {
    return this.workshopService.listForOrganizer();
  }

  @Get(':id')
  findPublic(@Param('id') id: string) {
    return this.workshopService.findPublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  update(@Param('id') id: string, @Body() dto: UpdateWorkshopDto) {
    return this.workshopService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkshopStatusDto,
  ) {
    return this.workshopService.updateStatus(id, dto.status);
  }

  @Post(':id/room-map')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_ROOM_MAP_SIZE_BYTES,
      },
    }),
  )
  uploadRoomMap(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.workshopService.uploadRoomMap(id, file);
  }
}
