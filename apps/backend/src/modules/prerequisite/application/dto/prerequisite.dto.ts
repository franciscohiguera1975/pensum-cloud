import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddPrerequisiteDto {
  @ApiProperty({ format: 'uuid', description: 'ID of the subject that is required' })
  @IsUUID()
  requiresId!: string;
}

export class PrerequisiteResponseDto {
  @ApiProperty() subjectId!: string;
  @ApiProperty() requiresId!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() createdAt!: Date;
}
