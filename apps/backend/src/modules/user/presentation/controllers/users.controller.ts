import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import {
  CreateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
  AssignRolesUseCase,
  DeactivateUserUseCase,
  DeleteUserUseCase,
} from '../../application/use-cases/user.use-cases';
import { AssignRolesDto, CreateUserDto, UpdateUserDto, UserResponseDto } from '../../application/dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly create: CreateUserUseCase,
    private readonly get: GetUserUseCase,
    private readonly list: ListUsersUseCase,
    private readonly update: UpdateUserUseCase,
    private readonly assignRoles: AssignRolesUseCase,
    private readonly deactivate: DeactivateUserUseCase,
    private readonly remove: DeleteUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a user for the tenant' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  createOne(@Body() dto: CreateUserDto, @Req() req: Request): Promise<UserResponseDto> {
    return this.create.execute(dto, req.tenantId!);
  }

  @Get()
  @ApiOperation({ summary: 'List all users for the tenant' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  listAll(@Req() req: Request): Promise<UserResponseDto[]> {
    return this.list.execute(req.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.get.execute(id, req.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user name' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.update.execute(id, dto, req.tenantId!);
  }

  @Put(':id/roles')
  @ApiOperation({ summary: 'Replace all roles for a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  setRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolesDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.assignRoles.execute(id, dto, req.tenantId!);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  deactivateOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.deactivate.execute(id, req.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user' })
  deleteOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<void> {
    return this.remove.execute(id, req.tenantId!);
  }
}
