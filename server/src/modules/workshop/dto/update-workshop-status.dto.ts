import { IsEnum } from 'class-validator';
import { WorkshopStatus } from '../../../../generated/prisma/enums';

export class UpdateWorkshopStatusDto {
  @IsEnum(WorkshopStatus)
  status: WorkshopStatus;
}
