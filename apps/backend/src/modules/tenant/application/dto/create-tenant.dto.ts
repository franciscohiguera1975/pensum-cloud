import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Universidad Nacional', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'uni-nacional', minLength: 3, maxLength: 63 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(63)
  slug!: string;
}
