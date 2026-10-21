import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  TenantAccessGuard,
  TenantContext,
} from '../common/guards/tenant-access.guard';
import { CurrentTenant } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireRoles } from '../common/decorators/require-roles.decorator';
import { MembershipRole } from '@automotive-os/database';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentResponseDto } from '../me/dto/create-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAccessGuard)
@Controller('api/v1/tenants/:tenantId/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List test-drive and showroom appointments for dealership' })
  @ApiResponse({ status: 200, type: [AppointmentResponseDto] })
  async listAppointments(
    @CurrentTenant() tenant: TenantContext
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.listTenantAppointments(tenant.tenantId);
  }

  @Patch(':id/status')
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.SALES_MANAGER,
    MembershipRole.SALES_AGENT
  )
  @ApiOperation({ summary: 'Update test-drive appointment status (Confirm, Reschedule, Cancel, Complete)' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser('id') actorUserId: string
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.updateAppointmentStatus(
      tenant.tenantId,
      appointmentId,
      dto,
      actorUserId
    );
  }
}
