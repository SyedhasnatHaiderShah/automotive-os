import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UuidParamPipe } from '../common/pipes/uuid-param.pipe';
import { PrismaService } from '../database/prisma.service';
import { CatalogOptionDto } from './dto/catalog-option.dto';

/** Read-only global make and model taxonomy used by vehicle intake. */
@ApiTags('catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('makes')
  @ApiOperation({ summary: 'List vehicle makes' })
  @ApiResponse({ status: 200, type: [CatalogOptionDto] })
  async listMakes(): Promise<CatalogOptionDto[]> {
    return this.prisma.make.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('makes/:makeId/models')
  @ApiOperation({ summary: 'List the models of one vehicle make' })
  @ApiResponse({ status: 200, type: [CatalogOptionDto] })
  async listModels(
    @Param('makeId', new UuidParamPipe()) makeId: string,
  ): Promise<CatalogOptionDto[]> {
    return this.prisma.carModel.findMany({
      where: { makeId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
