import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateUniversityDto {
  @ApiPropertyOptional({ example: 'Universidad de las Fuerzas Armadas ESPE', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Ecuador' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 'https://espe.edu.ec' })
  @IsUrl()
  @IsOptional()
  website?: string;
}
