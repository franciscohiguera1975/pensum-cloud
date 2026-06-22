import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';

// ── /public (root — no slug) ──────────────────────────────────────────────────
@ApiTags('Public')
@Controller('public')
export class PublicRootController {
  constructor(private readonly prisma: PrismaService) {}

  /** List all active tenants — used by the login page dropdown. */
  @Get('tenants')
  @ApiOperation({ summary: 'List all active tenants (public)' })
  async listTenants() {
    return this.prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}

// ── /public/:slug ─────────────────────────────────────────────────────────────
@ApiTags('Public')
@Controller('public/:slug')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Resolve slug to tenantId ──────────────────────────────────────────────
  private async resolveTenant(slug: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException(`Tenant '${slug}' not found`);
    }
    return tenant.id;
  }

  // ── Universities ──────────────────────────────────────────────────────────
  @Get('universities')
  @ApiOperation({ summary: 'List universities (public)' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async listUniversities(@Param('slug') slug: string) {
    const tenantId = await this.resolveTenant(slug);
    return this.prisma.university.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, country: true, website: true },
    });
  }

  // ── Faculties ─────────────────────────────────────────────────────────────
  @Get('universities/:universityId/faculties')
  @ApiOperation({ summary: 'List faculties of a university (public)' })
  async listFaculties(
    @Param('slug') slug: string,
    @Param('universityId') universityId: string,
  ) {
    const tenantId = await this.resolveTenant(slug);
    return this.prisma.faculty.findMany({
      where: { tenantId, universityId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
  }

  // ── Careers ───────────────────────────────────────────────────────────────
  @Get('faculties/:facultyId/careers')
  @ApiOperation({ summary: 'List careers of a faculty (public)' })
  async listCareers(
    @Param('slug') slug: string,
    @Param('facultyId') facultyId: string,
  ) {
    const tenantId = await this.resolveTenant(slug);
    return this.prisma.career.findMany({
      where: { tenantId, facultyId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, description: true },
    });
  }

  // ── Curricula ─────────────────────────────────────────────────────────────
  @Get('careers/:careerId/curricula')
  @ApiOperation({ summary: 'List active curricula of a career (public)' })
  async listCurricula(
    @Param('slug') slug: string,
    @Param('careerId') careerId: string,
  ) {
    const tenantId = await this.resolveTenant(slug);
    return this.prisma.curriculum.findMany({
      where: { tenantId, careerId, deletedAt: null },
      orderBy: { version: 'asc' },
      select: { id: true, name: true, version: true, status: true, description: true },
    });
  }

  // ── Curriculum full (with semesters + subjects + prerequisites) ────────────
  @Get('curricula/:curriculumId')
  @ApiOperation({ summary: 'Get full curriculum data for the pensum viewer (public)' })
  async getCurriculumFull(
    @Param('slug') slug: string,
    @Param('curriculumId') curriculumId: string,
  ) {
    const tenantId = await this.resolveTenant(slug);

    const curriculum = await this.prisma.curriculum.findFirst({
      where: { id: curriculumId, tenantId, deletedAt: null },
      include: {
        semesters: {
          where: { deletedAt: null },
          orderBy: { number: 'asc' },
          include: {
            subjects: {
              where: { deletedAt: null },
              orderBy: { code: 'asc' },
              include: {
                prerequisites: {
                  select: { requiresId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!curriculum) {
      throw new NotFoundException(`Curriculum ${curriculumId} not found`);
    }

    return {
      id: curriculum.id,
      name: curriculum.name,
      version: curriculum.version,
      status: curriculum.status,
      description: curriculum.description,
      semesters: curriculum.semesters.map((sem) => ({
        id: sem.id,
        number: sem.number,
        name: sem.name,
        subjects: sem.subjects.map((sub) => ({
          id: sub.id,
          name: sub.name,
          code: sub.code,
          credits: sub.credits,
          hoursTheory: sub.hoursTheory,
          hoursPractice: sub.hoursPractice,
          description: sub.description,
          prerequisiteIds: sub.prerequisites.map((p) => p.requiresId),
        })),
      })),
    };
  }
}
