import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTenantDto } from '../../application/dto/create-tenant.dto';
import { TenantResponseDto } from '../../application/dto/tenant-response.dto';
import { CreateTenantUseCase } from '../../application/use-cases/create-tenant.use-case';
import { DeactivateTenantUseCase } from '../../application/use-cases/deactivate-tenant.use-case';
import { GetTenantBySlugUseCase } from '../../application/use-cases/get-tenant-by-slug.use-case';
import { ListTenantsUseCase } from '../../application/use-cases/list-tenants.use-case';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    private readonly getTenantBySlug: GetTenantBySlugUseCase,
    private readonly listTenants: ListTenantsUseCase,
    private readonly deactivateTenant: DeactivateTenantUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, type: TenantResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.createTenant.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [TenantResponseDto] })
  findAll(
    @Query('onlyActive') onlyActive?: string,
  ): Promise<TenantResponseDto[]> {
    return this.listTenants.execute(onlyActive !== 'false');
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a tenant by slug' })
  @ApiParam({ name: 'slug', example: 'uni-nacional' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('slug') slug: string): Promise<TenantResponseDto> {
    return this.getTenantBySlug.execute(slug);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a tenant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Tenant already inactive' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    return this.deactivateTenant.execute(id);
  }
}
