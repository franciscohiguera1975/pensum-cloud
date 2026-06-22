import { Competency } from '../../domain/entities/competency.entity';
import { CompetencyResponseDto } from '../../application/dto/competency.dto';

export class CompetencyMapper {
  static toResponse(c: Competency): CompetencyResponseDto {
    return {
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      code: c.code,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  static toDomain(raw: {
    id: string;
    tenantId: string;
    name: string;
    code: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Competency {
    return Competency.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      code: raw.code,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
