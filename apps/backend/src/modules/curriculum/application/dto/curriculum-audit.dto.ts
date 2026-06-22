import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type SubjectDiffStatus = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';

export class FieldChangeDto {
  @ApiProperty() field: string;
  @ApiProperty() from: unknown;
  @ApiProperty() to: unknown;
}

export class SubjectDiffDto {
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() credits: number;
  @ApiProperty() semesterNumber: number;
  @ApiProperty({ enum: ['ADDED', 'REMOVED', 'MODIFIED', 'UNCHANGED'] }) status: SubjectDiffStatus;
  @ApiPropertyOptional({ type: [FieldChangeDto] }) changes?: FieldChangeDto[];
}

export class CurriculumCompareResponseDto {
  @ApiProperty() curriculumAId: string;
  @ApiProperty() curriculumBId: string;
  @ApiProperty() addedCount: number;
  @ApiProperty() removedCount: number;
  @ApiProperty() modifiedCount: number;
  @ApiProperty() unchangedCount: number;
  @ApiProperty({ type: [SubjectDiffDto] }) subjects: SubjectDiffDto[];
}

export class RedundancyGroupDto {
  @ApiProperty({ enum: ['SAME_COMPETENCIES'] }) reason: 'SAME_COMPETENCIES';
  @ApiProperty({ type: [String] }) subjectIds: string[];
  @ApiProperty({ type: [String] }) subjectCodes: string[];
  @ApiProperty({ type: [String] }) competencyIds: string[];
}

export class CurriculumRedundanciesResponseDto {
  @ApiProperty() curriculumId: string;
  @ApiProperty() totalRedundancyGroups: number;
  @ApiProperty({ type: [RedundancyGroupDto] }) groups: RedundancyGroupDto[];
}
