import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  workshopId: string;
}
