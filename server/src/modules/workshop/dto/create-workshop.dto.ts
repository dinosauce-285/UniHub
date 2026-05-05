import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { WorkshopStatus } from '../../../../generated/prisma/enums';

export class CreateWorkshopDto {
  @IsString()
  @MaxLength(160)
  title: string;

  @IsString()
  @MaxLength(4000)
  description: string;

  @IsString()
  @MaxLength(160)
  speaker: string;

  @IsString()
  @MaxLength(80)
  room: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  roomMapUrl?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsInt()
  @Min(1)
  totalSlots: number;

  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}
