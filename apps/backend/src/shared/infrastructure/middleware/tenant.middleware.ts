import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../database/prisma.service';

export const TENANT_ID_HEADER = 'x-tenant-id';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const tenantHeader = req.headers[TENANT_ID_HEADER] as string | undefined;

    if (!tenantHeader) {
      throw new BadRequestException(
        `Missing required header: ${TENANT_ID_HEADER}`,
      );
    }

    // If it's already a UUID, use it directly
    if (UUID_REGEX.test(tenantHeader)) {
      req.tenantId = tenantHeader;
      next();
      return;
    }

    // Otherwise treat it as a slug and resolve to UUID
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantHeader },
      select: { id: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException(`Tenant '${tenantHeader}' not found`);
    }

    req.tenantId = tenant.id;
    next();
  }
}
