import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../../../apps/backend/src/shared/infrastructure/database/prisma.module';
import { PrismaService } from '../../../../../apps/backend/src/shared/infrastructure/database/prisma.service';

describe('PrismaModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
    expect(prismaService).toBeInstanceOf(PrismaService);
  });

  it('should export PrismaService as global provider', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeTruthy();
  });
});
