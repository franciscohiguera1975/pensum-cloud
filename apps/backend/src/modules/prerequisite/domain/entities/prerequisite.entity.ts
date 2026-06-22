export interface PrerequisiteProps {
  subjectId: string;
  requiresId: string;
  tenantId: string;
  createdAt: Date;
}

export class Prerequisite {
  private constructor(private readonly props: PrerequisiteProps) {}

  static create(p: { subjectId: string; requiresId: string; tenantId: string }): Prerequisite {
    if (p.subjectId === p.requiresId) {
      throw new Error('A subject cannot be its own prerequisite');
    }
    return new Prerequisite({ ...p, createdAt: new Date() });
  }

  static reconstitute(props: PrerequisiteProps): Prerequisite {
    return new Prerequisite(props);
  }

  get subjectId(): string { return this.props.subjectId; }
  get requiresId(): string { return this.props.requiresId; }
  get tenantId(): string { return this.props.tenantId; }
  get createdAt(): Date { return this.props.createdAt; }
}
