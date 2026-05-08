import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ValidateCheckinDto {
  @IsString()
  @MaxLength(256)
  qrCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}
