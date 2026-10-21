import { ApiProperty } from '@nestjs/swagger';

export class AdminTenantSummaryDto {
  @ApiProperty({ description: 'Tenant UUID' })
  id!: string;

  @ApiProperty({ description: 'Dealership slug' })
  slug!: string;

  @ApiProperty({ description: 'Legal registered name' })
  legalName!: string;

  @ApiProperty({ description: 'Display name' })
  displayName!: string;

  @ApiProperty({ description: 'Dealership status' })
  status!: string;

  @ApiProperty({ description: 'KYB verification status' })
  verificationStatus!: string;

  @ApiProperty({ description: 'Number of active staff members' })
  staffCount!: number;

  @ApiProperty({ description: 'Number of inventory vehicles' })
  vehicleCount!: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;
}
