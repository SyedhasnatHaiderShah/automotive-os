import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidParamPipe } from '../../common/pipes/uuid-param.pipe';
import { AdminDataService } from './admin-data.service';
import { DataDeleteDto, DataListQueryDto } from './admin-data.dto';

/**
 * Platform-admin data console (AD-20): generic, audited CRUD over every table.
 * Model names are validated against the Prisma schema registry; ids must be
 * UUID-shaped; secrets are excluded by the registry.
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller('api/v1/admin/data')
export class AdminDataController {
  constructor(private readonly service: AdminDataService) {}

  @Get('models')
  @ApiOperation({ summary: 'List every managed table with its row count' })
  listModels() {
    return this.service.listModels();
  }

  @Get(':model/schema')
  @ApiOperation({ summary: 'Field metadata for a table (types, enums, read-only flags)' })
  describe(@Param('model') model: string) {
    return this.service.describe(model);
  }

  @Get(':model')
  @ApiOperation({ summary: 'Page through a table with search and sort' })
  list(@Param('model') model: string, @Query() query: DataListQueryDto) {
    return this.service.list(model, query);
  }

  @Get(':model/:id')
  @ApiOperation({ summary: 'Read one row' })
  getOne(@Param('model') model: string, @Param('id', new UuidParamPipe()) id: string) {
    return this.service.get(model, id);
  }

  @Post(':model')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a row (audited)' })
  create(
    @Param('model') model: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.service.create(model, body, adminUserId);
  }

  @Patch(':model/:id')
  @ApiOperation({ summary: 'Update editable fields of a row (audited)' })
  update(
    @Param('model') model: string,
    @Param('id', new UuidParamPipe()) id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.service.update(model, id, body, adminUserId);
  }

  @Delete(':model/:id')
  @ApiOperation({ summary: 'Delete a row (audited; database cascades apply)' })
  remove(
    @Param('model') model: string,
    @Param('id', new UuidParamPipe()) id: string,
    @Body() body: DataDeleteDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.service.remove(model, id, adminUserId, body?.reason);
  }
}
