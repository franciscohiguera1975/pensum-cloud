import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type SubjectPathStatus = 'COMPLETED' | 'AVAILABLE' | 'LOCKED';

export class SubjectPathDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() credits: number;
  @ApiProperty() semesterNumber: number;
  @ApiProperty({ enum: ['COMPLETED', 'AVAILABLE', 'LOCKED'] })
  status: SubjectPathStatus;
  @ApiPropertyOptional({
    description: 'IDs of prerequisites not yet completed (only present when LOCKED)',
    type: [String],
  })
  missingPrerequisites?: string[];
}

export class CurriculumPathResponseDto {
  @ApiProperty() curriculumId: string;
  @ApiProperty() totalSubjects: number;
  @ApiProperty() completedCount: number;
  @ApiProperty() availableCount: number;
  @ApiProperty() lockedCount: number;
  @ApiProperty({ type: [SubjectPathDto] })
  subjects: SubjectPathDto[];
}
