import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorkshopDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  aiSummary?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  speaker?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  room?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  roomMapUrl?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalSlots?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}
