import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncCheckinRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  qrCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  registrationId?: string;

  @IsDateString()
  checkedInAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}

export class SyncCheckinsDto {
  @IsArray()
  @ArrayMaxSize(250)
  @ValidateNested({ each: true })
  @Type(() => SyncCheckinRecordDto)
  records: SyncCheckinRecordDto[];
}
