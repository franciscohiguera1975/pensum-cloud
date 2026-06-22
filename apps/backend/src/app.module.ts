import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { appConfig } from './shared/infrastructure/config/app.config';
import { TenantMiddleware } from './shared/infrastructure/middleware/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UniversityModule } from './modules/university/university.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { CareerModule } from './modules/career/career.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { SemesterModule } from './modules/semester/semester.module';
import { SubjectModule } from './modules/subject/subject.module';
import { PrerequisiteModule } from './modules/prerequisite/prerequisite.module';
import { CompetencyModule } from './modules/competency/competency.module';
import { LearningOutcomeModule } from './modules/learning-outcome/learning-outcome.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    UniversityModule,
    FacultyModule,
    CareerModule,
    CurriculumModule,
    SemesterModule,
    SubjectModule,
    PrerequisiteModule,
    CompetencyModule,
    LearningOutcomeModule,
    PublicModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply TenantMiddleware to all routes except auth and public.
    // Auth routes receive tenantId in the request body.
    // Public routes carry the tenant slug in the URL path.
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        'public/(.*)',   // /public/tenants, /public/:slug/universities, etc.
      )
      .forRoutes('*');
  }
}
