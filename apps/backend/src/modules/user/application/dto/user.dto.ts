import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ type: [String], example: ['VIEWER'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleNames?: string[];
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email', 'password', 'roleNames'] as const)) {}

export class AssignRolesDto {
  @ApiProperty({ type: [String], example: ['ADMIN', 'COORDINATOR'] })
  @IsArray()
  @IsString({ each: true })
  roleNames: string[];
}

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() fullName: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: [String] }) roles: string[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
